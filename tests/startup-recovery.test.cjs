const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const prefix=fs.readFileSync('source/online/bridge-prefix.js','utf8');
function context(storage=new Map()){
 const state={reloads:0,offline:0,callbacks:[],notices:[]};
 const element=()=>({style:{},appendChild(){}});
 const c={console,Promise,setTimeout(fn){state.callbacks.push(fn);},location:{protocol:'https:',hostname:'pokesurvivor.com',reload(){state.reloads++;}},localStorage:{getItem(){return 'zh';}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{},AndroidApp:{openOffline(){state.offline++;}},document:{body:{appendChild:e=>state.notices.push(e)},getElementById(){return null;},createElement:element}};
 c.window=c;vm.createContext(c);return {c,state,storage};
}
test('online loader runs the official client as a separate script, so enhancements cannot block it',()=>{
 const loader=fs.readFileSync('source/online/client-loader.js','utf8');
 assert(!prefix.includes('new Function'),'the official CSP forbids eval');
 assert.match(loader,/__ps_original/);assert.match(loader,/openOffline/);
 const {c,state}=context();vm.runInContext(prefix+';window.officialExecuted=true;',c);
 assert(c.officialExecuted);assert.equal(state.reloads,0);
});
test('partial install failure displays recovery instead of permanently disabling enhancements',async()=>{
 const {c,state,storage}=context();vm.runInContext(prefix+`;var gameRoot={World:{},DB:{},Touch:{},Settings:{get:function(){return true;}}};gameRoot.Game={startRun:function(){}};`,c);
 await Promise.resolve();await Promise.resolve();assert.equal(state.reloads,0);assert.equal(state.notices.length,1);
 storage.set('ps.online.disable-enhancements','1');
 const next=context(storage);vm.runInContext(prefix+';window.officialExecuted=true;',next.c);
 assert(next.c.officialExecuted);assert.equal(next.state.reloads,0);assert.equal(next.storage.get('ps.online.disable-enhancements'),undefined);assert.equal(next.state.callbacks.length,1);
});
test('unrecognized official client removes the temporary prototype hook before recovery',()=>{
 const {c,state}=context();vm.runInContext(prefix,c);state.callbacks.forEach(fn=>fn());
 assert.equal(vm.runInContext("Object.getOwnPropertyDescriptor(Object.prototype,'Game')",c),undefined);
 assert.equal(state.reloads,0);assert.equal(state.notices.length,1);
});
test('unavailable session storage still displays recovery without a reload loop',()=>{
 const {c,state}=context();c.sessionStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 vm.runInContext(prefix,c);state.callbacks.forEach(fn=>fn());assert.equal(state.reloads,0);assert.equal(state.notices.length,1);
});
test('layout remains usable when ResizeObserver is unavailable',()=>{
 const bar={classList:{contains(){return false;}},getBoundingClientRect(){return {bottom:50};}};let bottom;
 const c={location:{protocol:'https:'},document:{getElementById:id=>id==='topbar'?bar:null,documentElement:{style:{setProperty(k,v){bottom=v;}}}},requestAnimationFrame(fn){fn();return 1;},MutationObserver:class{observe(){}},addEventListener(){},window:{}};
 vm.runInNewContext(fs.readFileSync('source/js/core/mobile-layout.js','utf8'),c);assert.equal(bottom,'50px');
});
test('startup probe reports readiness only after the loading screen is dismissed',()=>{
 const s=fs.readFileSync('android/smali/com/john/pokesurvivor/StartupChromeClient.smali','utf8');
 const js=JSON.parse(s.match(/const-string v0, ("[^\n]+")/)[1]);let ready=0,hidden=false,tick;
 const c={location:{protocol:'https:',hostname:'pokesurvivor.com'},document:{getElementById:id=>id==='boot'?{classList:{contains(){return hidden;}}}:null},AndroidApp:{startupReady(){ready++;}},setInterval(fn){tick=fn;return 1;},clearInterval(){}};c.window=c;
 vm.runInNewContext(js,c);tick();assert.equal(ready,0);hidden=true;tick();assert.equal(ready,1);
});
