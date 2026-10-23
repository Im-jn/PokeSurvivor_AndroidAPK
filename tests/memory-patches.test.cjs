// Late runs: the official client kept every sprite sheet it ever preloaded
// decoded, plus a sheet-sized white copy for the hit flash. The APK patches the
// bundled official build (tools/official-patches.cjs) for online and offline.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const {patchOfficial,patches}=require('../tools/official-patches.cjs');
const official=fs.readFileSync(path.join(root,'source/vendor/official/app.min.js'),'utf8');
test('every memory patch still applies to the bundled official build',()=>{
  const r=patchOfficial(official);
  assert.deepEqual(r.skipped,[],'official code changed: update tools/official-patches.cjs');
  assert.equal(r.applied.length,patches.length);
  new vm.Script(r.code);
  assert.equal(fs.readFileSync(path.join(root,'source/js/official-app.js'),'utf8'),r.code,'js/official-app.js is rebuilt from the snapshot');
});
test('online serves the patched copy for the same official version',()=>{
  const res=JSON.parse(fs.readFileSync(path.join(root,'source/online/local-resources.json'),'utf8'));
  const app=Object.entries(res).find(([u])=>u.startsWith('https://pokesurvivor.com/js/app.min.js?v='));
  assert(app&&app[1].file==='js/official-app.js');
});
test('prefix provides the caches the patched client asks for, before it runs',()=>{
  const prefix=fs.readFileSync(path.join(root,'source/online/bridge-prefix.js'),'utf8');
  const window={};const ctx={window,Map,Date,setInterval:()=>0,location:{protocol:'file:'},sessionStorage:{removeItem(){}},localStorage:{getItem:()=>'zh-Hans'},Object,String,Array,Math,Promise,document:{},setTimeout:()=>0,navigator:{}};
  ctx.window=ctx;ctx.addEventListener=()=>{};
  try{vm.runInNewContext(prefix,ctx);}catch(_){}
  assert.equal(typeof ctx.__psWhiteCache,'function');assert.equal(typeof ctx.__psSheetCache,'function');
  // White cache: bounded, and unused entries expire.
  let now=1e6;ctx.Date={now:()=>now};
  const white=ctx.__psWhiteCache();
  for(let i=0;i<60;i++)white.set({i},{});
  assert(white.size<=40);
  const key={},canvas={};white.set(key,canvas);assert.equal(white.get(key),canvas);
  now+=10000;white.get({});assert.equal(white.get(key),undefined);
  // Sheet cache: stale sheets freed like the client does it, fresh ones kept.
  let tick;ctx.setInterval=f=>{tick=f;return 1;};
  const sheets=ctx.__psSheetCache();
  for(let i=0;i<150;i++)sheets.set('s'+i,{at:now-(i<100?60000:0),img:{src:'x'}});
  const old=sheets.get('s0');tick();
  assert.equal(sheets.size,80);assert(!sheets.has('s0')&&old.img.src==='');assert(sheets.has('s149'));
});
