const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../source');
const c=vm.createContext({G:{}});
for(const f of ['js/data/zh-dictionary.js','js/data/map-labels-zh.js','js/core/zh-translate.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const t=c.G.ZhTranslate;
test('Pokemon, moves, held items and native map labels',()=>{
  assert.equal(t('Bulbasaur · Pikachu · Charizard · Mew · Type: Null'),'妙蛙种子 · 皮卡丘 · 喷火龙 · 梦幻 · 属性：空');
  assert.equal(t('Thunderbolt · Shadow Ball · Leftovers'),'十万伏特 · 暗影球 · 吃剩的东西');
  assert.equal(t('Mapa de recursos'),'资源地图');assert.equal(t('Cofre pequeño'),'小宝箱');
});
test('dynamic texts translate terms but preserve player nickname slots',()=>{
  assert.equal(t('Pikachu invites you to play in their room'),'Pikachu 邀请你加入房间游玩');
  assert.equal(t('Defeat 50 Fire-type Pokémon'),'击败 50 只火属性宝可梦');
  assert.equal(t('SHADY FOREST · 12 DEFEATED · 5 COINS'),'幽暗森林 · 击败 12 · 金币 5');
  assert.equal(t('Playback attackSpeed playerFire'),'Playback attackSpeed playerFire');
});
test('all name aliases and template placeholder counts remain valid',()=>{
  for(const [source,target]of Object.entries(c.G.ZhData.names))assert.equal(t(source),target,source);
  for(const [source,target]of Object.entries(c.G.ZhData.phrases))assert.equal((source.match(/\{x\}/g)||[]).length,(target.match(/\{x\}/g)||[]).length,source);
});

test('runtime Chinese dictionaries invalidate previous untranslated cache entries',()=>{
 const source='Nuevo panel de prueba';assert.equal(t(source),source);
 t.add({[source]:'新增测试面板'});assert.equal(t(source),'新增测试面板');
 assert.equal(t('11 h 24 min'),'11 小时 24 分钟');
});

test('Chinese I18n registrations feed the active translator and retain raw player slots',()=>{
 const ctx={G:{},console,localStorage:{getItem:()=> 'zh'},location:{pathname:'/'},navigator:{language:'zh-CN'},document:{documentElement:{}},CanvasRenderingContext2D:class{fillText(){}strokeText(){}measureText(){}},confirm(){},alert(){}};ctx.window=ctx;vm.createContext(ctx);
 for(const f of ['js/data/zh-dictionary.js','js/data/map-labels-zh.js','js/core/zh-translate.js','js/core/i18n.js','js/data/lang-en.js','js/data/lang-zh.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
 assert.equal(ctx.G.T('Tu partida se guarda'),'你的进度会被');
 assert.equal(ctx.G.T('automáticamente'),'自动保存');
 ctx.G.I18n.add({'Nuevo texto dinámico':'新的动态提示'});assert.equal(ctx.G.T('Nuevo texto dinámico'),'新的动态提示');
 ctx.G.I18n.add({'{x} te invita a probar':'{x} invites you to play in their room'});
 assert.equal(ctx.G.T('Pikachu te invita a probar'),'Pikachu 邀请你加入房间游玩');
});
