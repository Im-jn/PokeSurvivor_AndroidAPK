const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function create(nativeValue,css={}){
 const events={},vars={},state={value:nativeValue};
 const c={G:{Settings:{touch:true}},Date,Math,innerWidth:844,innerHeight:390,addEventListener:(name,fn)=>{events[name]=fn;},document:{createElement:()=>({style:{},remove(){}}),body:{appendChild(){}},documentElement:{style:{setProperty:(k,v)=>{vars[k]=v;}}}},getComputedStyle:()=>({paddingTop:'0px',paddingRight:'0px',paddingBottom:'0px',paddingLeft:'0px',...css})};
 c.window=c;if(nativeValue!==undefined)c.AndroidApp={getCutoutInsets:()=>state.value};
 vm.createContext(c);vm.runInContext(fs.readFileSync('source/js/core/touch.js','utf8'),c);
 return {get:()=>JSON.parse(JSON.stringify(c.G.Touch.safeArea())),events,state,vars};
}
test('native physical cutout pixels are converted to CSS pixels and keep the canvas viewport intact',()=>{
 const c=create('96,0,0,0,3');assert.deepEqual(c.get(),{left:32,top:0,right:0,bottom:0});assert.equal(c.vars['--ps-safe-left'],'32px');
});
test('rotation clears cached left insets and uses the right-side cutout',()=>{
 const c=create('120,0,0,0,3');assert.equal(c.get().left,40);c.state.value='0,0,120,0,3';c.events.orientationchange();assert.deepEqual(c.get(),{left:0,top:0,right:40,bottom:0});
});
test('CSS safe-area and native insets merge without double padding',()=>{
 const c=create('96,0,0,0,3',{paddingLeft:'32px',paddingBottom:'12px'});assert.deepEqual(c.get(),{left:32,top:0,right:0,bottom:12});
});
test('older wrappers and malformed inset payloads use CSS fallback',()=>{
 for(const payload of [undefined,'not-an-inset','NaN,0,0,0,3','1,2,3,4,0','-1,0,0,0,2'])assert.deepEqual(create(payload,{paddingLeft:'10px'}).get(),{left:10,top:0,right:0,bottom:0});
});
