// APK cloud sync: upload when leaving the screen, merge when back in the menus.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../source/online/cloud-sync.js'),'utf8');
function setup({online=true,sync='pending',state='ui'}={}){
  const calls=[],listeners={},winListeners={};let now=1e9;
  const doc={visibilityState:'visible',addEventListener:(t,f)=>(listeners[t]=f)};
  const G={DB:{get online(){return online;},get syncState(){return sync;},saveNow:async()=>{calls.push('save');return {ok:true};},flush:async()=>{calls.push('flush');}},Game:{state},Audio:{setAppActive(v){calls.push('audio:'+v);}}};
  const c={G,document:doc,addEventListener:(t,f)=>(winListeners[t]=f),Date:{now:()=>now},Promise,console};
  vm.runInNewContext(code,c);
  return {calls,G,doc,hide(){doc.visibilityState='hidden';listeners.visibilitychange();},show(){doc.visibilityState='visible';listeners.visibilitychange();},wait(ms){now+=ms;},set sync(v){sync=v;},set state(v){G.Game.state=v;}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('leaving the screen uploads pending changes, not synced ones',async()=>{
  const a=setup({sync:'pending'});a.hide();await tick();assert.deepEqual(a.calls,['save']);
  const b=setup({sync:'ok'});b.hide();await tick();assert.deepEqual(b.calls,[]);
  const g=setup({online:false});g.hide();await tick();assert.deepEqual(g.calls,[]);
});
test('coming back to the menus after a minute merges the cloud save',async()=>{
  const a=setup({sync:'ok'});a.hide();a.wait(30e3);a.show();await tick();assert.deepEqual(a.calls,[],'short absence: nothing');
  a.hide();a.wait(120e3);a.show();await tick();assert.deepEqual(a.calls,['flush']);
  a.hide();a.wait(120e3);a.show();await tick();assert.deepEqual(a.calls,['flush'],'throttled to one sync per 3 minutes');
  const r=setup({sync:'ok',state:'playing'});r.hide();r.wait(120e3);r.show();await tick();assert.deepEqual(r.calls,[],'never during a run');
});
test('native onPause/onResume (via the audio hook) triggers the same sync',async()=>{
  const a=setup({sync:'pending'});a.G.Audio.setAppActive(false);a.wait(120e3);a.sync='ok';a.G.Audio.setAppActive(true);await tick();
  assert.deepEqual(a.calls,['save','audio:false','flush','audio:true']);
});
