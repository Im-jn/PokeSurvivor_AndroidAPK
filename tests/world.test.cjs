const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function world(file){
  const c=vm.createContext({console,Math});c.window=c;
  vm.runInContext(fs.readFileSync(path.join(root,'source/js/core/util.js'),'utf8'),c);
  c.G.Sprites={PX:2};
  vm.runInContext(fs.readFileSync(path.join(root,'source/js/world/tiles.js'),'utf8'),c);
  let code=fs.readFileSync(path.join(root,file),'utf8');
  const i=code.lastIndexOf('  return {');
  code=code.slice(0,i)+code.slice(i).replace('  return {',`  return { __snapshot() { return JSON.stringify({nextPropId,broken:[...broken],data:[...data].map(([k,c])=>[k,Array.from(c.terr),c.props])}); }, __chunk:chunkData,`);
  vm.runInContext(code,c);return c.G.World;
}
test('refactored generation exactly matches original APK across seeds, negative chunks and rift arenas',()=>{
  for(const seed of [1,4242,984571])for(const arena of [null,{tx:155,ty:-130,r:20,type:'normal'}]){
    const a=world('verification/original-world.js'),b=world('source/js/world/world.js');
    a.reset(seed);b.reset(seed);if(arena){a.setArena({...arena});b.setArena({...arena});}
    for(const [cx,cy] of [[0,0],[-1,-1],[2,-3],[-5,6],[9,-8],[10,-9]]){a.__chunk(cx,cy);b.__chunk(cx,cy);}
    assert.equal(b.__snapshot(),a.__snapshot(),`seed ${seed}, arena ${!!arena}`);
  }
});
test('wide-map preview does not generate chunks, allocate prop IDs or change game state',()=>{
  const w=world('source/js/world/world.js');w.reset(9743);w.__chunk(0,0);
  const before=w.__snapshot();const result=w.mapSample(-50,-50,100,100,true);
  assert.equal(w.__snapshot(),before);assert(result.props.some(p=>p.predicted));assert.equal(result.terrain.length,10000);
});
test('predicted props and terrain match the actual generator when chunks load',()=>{
  const w=world('source/js/world/world.js');w.reset(8456);
  const preview=w.mapSample(-32,-32,64,64,true);
  for(let y=-2;y<2;y++)for(let x=-2;x<2;x++)w.__chunk(x,y);
  const actual=w.mapSample(-32,-32,64,64,true);
  assert.deepEqual(Array.from(preview.terrain),Array.from(actual.terrain));
  const props=s=>s.props.map(p=>[p.tx,p.ty,p.type].join(',')).sort();
  assert.deepEqual(props(preview),props(actual));assert(actual.props.every(p=>!p.predicted));
});
test('prediction off keeps ungenerated areas unknown; reset and arena transitions invalidate preview cache',()=>{
  const w=world('source/js/world/world.js');w.reset(1);
  const unknown=w.mapSample(130,130,16,16,false);assert(unknown.terrain.every(t=>t===3));assert.equal(unknown.props.length,0);
  const old=Array.from(w.mapSample(130,130,32,32).terrain);w.reset(987654);
  assert.notDeepEqual(Array.from(w.mapSample(130,130,32,32).terrain),old);
  w.setArena({tx:145,ty:145,r:14,type:'normal'});
  const arena=Array.from(w.mapSample(130,130,32,32).terrain);
  w.setArena(null);assert.notDeepEqual(Array.from(w.mapSample(130,130,32,32).terrain),arena);
});
test('used altars, destroyed chests and exhausted springs retain their current loaded state',()=>{
  const w=world('source/js/world/world.js');w.reset(4242);
  const p=w.mapSample(-80,-80,160,160).props.find(p=>p.type==='altar');assert(p);
  const chunk=w.__chunk(Math.floor(p.tx/16),Math.floor(p.ty/16));
  chunk.props.find(a=>a.tx===p.tx&&a.ty===p.ty).used=true;
  assert(!w.mapSample(p.tx,p.ty,1,1).props.length);
  const chest=w.mapSample(-80,-80,160,160).props.find(p=>p.type==='chest');assert(chest);
  w.__chunk(Math.floor(chest.tx/16),Math.floor(chest.ty/16)).props.find(p=>p.tx===chest.tx&&p.ty===chest.ty).hp=0;
  assert(!w.mapSample(chest.tx,chest.ty,1,1).props.length);
});
