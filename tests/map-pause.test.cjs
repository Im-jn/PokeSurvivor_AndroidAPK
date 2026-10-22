const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function game(coop=false){
 const calls=[];
 const G={Input:{reset:()=>calls.push('input')},Touch:{reset:()=>calls.push('touch')},MapUI:{isOpen:true},UI:{isOpen:()=>false},Social:{me:{name:'Tester'}},Spawner:{say(){}},Coop:{active:coop}};
 const c={G};vm.createContext(c);
 const source=fs.readFileSync('source/js/game.js','utf8').replace('get state() { return state; },',"__testSet(s) { state=s; pl={bonds:1}; }, __testHold:coopApi.hold, get state() { return state; },");
 vm.runInContext(source,c);G.Coop.holdStart=()=>{calls.push('hold-start');G.Game.__testHold(['Tester']);};G.Coop.holdEnd=()=>{calls.push('hold-end');G.Game.__testHold([]);};
 return {G,calls};
}
test('opening map from combat pauses; closing resumes only the previous playing state',()=>{
 const {G}=game();G.Game.__testSet('playing');const token=G.Game.pauseForMap();assert.equal(G.Game.state,'paused');G.Game.resumeFromMap(token);assert.equal(G.Game.state,'playing');
 G.Game.__testSet('paused');const paused=G.Game.pauseForMap();G.Game.resumeFromMap(paused);assert.equal(G.Game.state,'paused');
});
test('map close cannot revive a finished run',()=>{
 const {G}=game();G.Game.__testSet('playing');const token=G.Game.pauseForMap();G.Game.__testSet('over');G.Game.resumeFromMap(token);assert.equal(G.Game.state,'over');
});
test('group maps acquire and release the existing team-wide pause without opening a bond screen',()=>{
 const {G,calls}=game(true);G.Game.__testSet('playing');const token=G.Game.pauseForMap();assert.equal(G.Game.state,'held');assert(calls.includes('hold-start'));
 G.Game.resumeFromMap(token);assert.equal(G.Game.state,'playing');assert.equal(calls.filter(x=>x==='hold-end').length,1);
});
test('closing map respects another teammate pause',()=>{
 const {G}=game(true);G.Game.__testSet('playing');const token=G.Game.pauseForMap();G.Coop.holdEnd=()=>G.Game.__testHold(['Other player']);G.Game.resumeFromMap(token);assert.equal(G.Game.state,'held');
});
