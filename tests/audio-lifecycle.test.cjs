const {test}=require('node:test');
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function create({hidden=false,nativeActive=true,deferResume=false}={}){
 const events={},contexts=[],store=new Map();
 const param=()=>({value:0,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
 const node=()=>({gain:param(),threshold:param(),ratio:param(),connect(){return this},disconnect(){}});
 class AC{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=8;this.destination={};this.gains=[];contexts.push(this)}
  createDynamicsCompressor(){return node()} createGain(){const n=node();this.gains.push(n);return n} createConvolver(){return node()}
  createBuffer(channels,len){return {getChannelData:()=>new Float32Array(len)}}
  suspend(){this.state='suspended';return Promise.resolve()}
  resume(){if(deferResume)return new Promise(resolve=>{this.finishResume=()=>{this.state='running';resolve()}});this.state='running';return Promise.resolve()}
 }
 const add=(name,fn)=>{(events[name]??=[]).push(fn)};
 const c={G:{U:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))},MUSIC:{village:{bpm:120,bars:1,chords:['C'],parts:[],drums:{}}}},document:{hidden,addEventListener:add},AudioContext:AC,AndroidApp:{isAppActive:()=>nativeActive},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},addEventListener:add,setTimeout(){return 1},setInterval(){return 1},clearInterval(){},performance:{now:()=>1000}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('source/js/core/audio.js','utf8'),c);
 return {c,audio:c.G.Audio,contexts,store,events,fire:async name=>{await Promise.all((events[name]||[]).map(fn=>fn()))}};
}
test('background suspends immediately without changing music preference or volumes',async()=>{
 const t=create();t.audio.music('village');t.audio.unlock();await t.audio.setAppActive(true);
 t.audio.setVolume('music',0.3);const saved=t.store.get('ps.audio');
 const ctx=t.contexts[0];const pending=t.audio.setAppActive(false);assert.equal(ctx.gains[0].gain.value,0);await pending;
 assert.equal(ctx.state,'suspended');assert.equal(t.audio.canPlay(),false);assert.equal(t.audio.track,'village');assert.equal(t.store.get('ps.audio'),saved);
 t.audio.unlock();assert.equal(ctx.state,'suspended');await t.audio.setAppActive(true);assert.equal(ctx.state,'running');assert.equal(ctx.gains[0].gain.value,0.9);
});
test('hidden pages and pagehide are silent, foreground recovery keeps mute',async()=>{
 const t=create();t.audio.unlock();await t.audio.setAppActive(true);t.audio.toggleMute();
 t.c.document.hidden=true;await t.fire('visibilitychange');assert.equal(t.contexts[0].state,'suspended');
 await t.audio.setAppActive(true);assert.equal(t.contexts[0].state,'suspended');
 t.c.document.hidden=false;await t.fire('visibilitychange');assert.equal(t.contexts[0].state,'running');assert.equal(t.audio.settings.muted,true);
 await t.fire('pagehide');assert.equal(t.contexts[0].state,'suspended');await t.fire('pageshow');assert.equal(t.contexts[0].state,'running');
});
test('native startup background does not create an audio context',()=>{
 const t=create({nativeActive:false});t.audio.music('village');t.audio.unlock();assert.equal(t.contexts.length,0);
});
test('pause during a pending resume cannot leave audio running',async()=>{
 const t=create({deferResume:true});t.audio.unlock();await t.audio.setAppActive(false);
 const resume=t.audio.setAppActive(true);for(let i=0;i<6;i++)await Promise.resolve();
 const ctx=t.contexts[0];assert.equal(typeof ctx.finishResume,'function');const pause=t.audio.setAppActive(false);ctx.finishResume();await Promise.all([resume,pause]);
 assert.equal(ctx.state,'suspended');assert.equal(ctx.gains[0].gain.value,0);
});
test('exit stays silent even if stale foreground events arrive',async()=>{
 const t=create();t.audio.music('village');t.audio.unlock();await t.audio.setAppActive(true);await t.audio.stopForExit();
 await t.audio.setAppActive(true);await t.fire('pageshow');t.audio.unlock();assert.equal(t.contexts[0].state,'suspended');assert.equal(t.audio.track,null);
});
