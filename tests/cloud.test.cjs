const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup({remote,offline=false,sdkFail=false,storage=new Map(),session=null,protocol='https:'}={}){
 const state={remote,reads:[],writes:[],authCalls:[],config:null,offline};
 const auth={currentUser:session,setPersistence:async()=>{},onAuthStateChanged(fn){queueMicrotask(()=>fn(auth.currentUser));return()=>{};},async signOut(){auth.currentUser=null;},async signInWithEmailAndPassword(email,password){state.authCalls.push({email,password});if(password!=='test-password')throw {code:'auth/invalid-credential'};auth.currentUser={uid:'official-user-1',email,displayName:'Ash'};return {user:auth.currentUser};}};
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'local'}};
 const snap=()=>({exists:!!state.remote,data:()=>({save:JSON.parse(JSON.stringify(state.remote))})});
 const firestore={collection(name){assert.equal(name,'saves');return {doc(uid){assert.equal(uid,'official-user-1');return {get:async()=>{state.reads.push(uid);if(state.offline)throw {code:'unavailable'};return snap();}};} };},async runTransaction(fn){if(state.offline)throw {code:'unavailable'};await fn({get:async()=>snap(),set(ref,data){state.writes.push(data);state.remote=JSON.parse(JSON.stringify(data.save));}});}};
 const fsFn=()=>firestore;fsFn.FieldValue={serverTimestamp:()=>123};
 const firebase={auth:authFn,firestore:fsFn,initializeApp(config){state.config=config;}};
  const context={console,TextEncoder,Uint8Array,Date,Math,navigator:{onLine:!offline},location:{protocol},firebase,G:{FIREBASE_CONFIG:{apiKey:'public-test-key',projectId:'pokesurvivor-free'}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener(){},setInterval(){},clearTimeout,setTimeout(fn,ms){return setTimeout(fn,ms).unref();},document:{createElement(){return {remove(){}};},head:{appendChild(el){assert.match(el.src,/^https:\/\/www.gstatic.com\/firebasejs\//);queueMicrotask(()=>sdkFail?el.onerror():el.onload());}},addEventListener(){}}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync('source/js/core/db.js','utf8'),context);
 return {db:context.G.DB,state,storage,auth};
}
const remote=()=>({name:'Ash',coins:750,partner:25,owned:{25:{at:10,from:'starter'}},updated:100,created:1});
test('HTTPS DB module initializes the configured cloud backend and waits for login',async()=>{
 const {db,state}=setup();assert.equal(await db.ready(),false);assert.equal(db.mode,'cloud');assert.equal(state.config.projectId,'pokesurvivor-free');assert.equal(db.loggedIn,false);
});
test('official username encoding, cloud read and explicit sync never merge guest progress',async()=>{
 const {db,state,storage}=setup({remote:remote()});await db.ready();db.playAsGuest();db.save.coins=99999;db.save.owned[151]={at:1};db.commit();
 const guest=storage.get('ps.save.guest');assert.equal((await db.login('Ash_1','test-password')).ok,true);
 assert.equal(state.authCalls[0].email,'6173685f31@jugadores.pokesurvivor.net');assert.equal(db.save.coins,750);assert(!db.save.owned[151]);assert.equal(db.online,true);assert.equal(state.writes.length,0);
 db.save.coins=760;db.commit();await db.flush();assert.equal(state.remote.coins,760);assert.equal(db.syncState,'ok');assert.equal(storage.get('ps.save.guest'),guest);
 await db.logout();assert.equal(db.loggedIn,false);db.playAsGuest();assert.equal(db.save.coins,99999);assert(db.save.owned[151]);
});
test('invalid credentials preserve local guest save and never write cloud data',async()=>{
 const {db,state,storage}=setup({remote:remote()});await db.ready();db.playAsGuest();db.commit();const before=storage.get('ps.save.guest');
 assert.equal((await db.login('Ash','wrong-password')).ok,false);assert.equal(db.guest,true);assert.equal(storage.get('ps.save.guest'),before);assert.equal(state.writes.length,0);
});
test('failed cloud read does not fabricate a new save or erase the current guest',async()=>{
 const {db,state,auth}=setup({remote:remote(),offline:true});await db.ready();db.playAsGuest();db.save.coins=123;
 assert.equal((await db.login('Ash','test-password')).ok,false);assert.equal(db.guest,true);assert.equal(db.save.coins,123);assert.equal(auth.currentUser,null);assert.equal(state.writes.length,0);
});
test('offline sync retains the account cache for retry without reporting success',async()=>{
 const {db,state,storage}=setup({remote:remote()});await db.ready();await db.login('Ash','test-password');state.offline=true;db.save.coins=780;db.commit();await db.flush();
 assert.equal(db.syncState,'offline');assert.equal(JSON.parse(storage.get('ps.cloud.official-user-1')).coins,780);assert.equal(state.remote.coins,750);
});
test('SDK initialization failure cannot silently create a same-name local account',async()=>{
 const {db,state}=setup({sdkFail:true});await db.ready();assert.equal(db.mode,'local');assert.equal((await db.login('Ash','test-password')).ok,false);assert.equal((await db.register('Ash','test-password')).ok,false);assert.equal(state.writes.length,0);
});
test('guest session restores when cloud has no signed-in user; cloud sessions restore independently',async()=>{
 const storage=new Map();const first=setup({storage});await first.db.ready();first.db.playAsGuest();first.db.save.coins=42;first.db.commit();
 const second=setup({storage});assert.equal(await second.db.ready(),true);assert.equal(second.db.guest,true);assert.equal(second.db.save.coins,42);
 const third=setup({storage,remote:remote(),session:{uid:'official-user-1',displayName:'Ash'}});assert.equal(await third.db.ready(),true);assert.equal(third.db.guest,false);assert.equal(third.db.save.coins,750);
});

test('file origin keeps an existing guest save offline without initializing Firebase',async()=>{
 const first=setup();await first.db.ready();first.db.playAsGuest();first.db.save.coins=4242;first.db.commit();
 const before=first.storage.get('ps.save.guest');const next=setup({storage:first.storage,protocol:'file:'});
 assert.equal(await next.db.ready(),true);assert.equal(next.db.mode,'local');assert.equal(next.db.localReason,'offline');assert.equal(next.db.save.coins,4242);assert.equal(next.state.config,null);assert.equal(first.storage.get('ps.save.guest'),before);assert.equal(next.state.writes.length,0);
});
