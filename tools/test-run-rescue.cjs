// App killed mid-run: the next start pays the run's coins (game formula) once.
// A run that ends normally must not be paid twice.
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const url=pathToFileURL(path.resolve('source/index.html')).href+'?offline';
  const boot=async()=>{await page.waitForFunction(()=>window.G&&G.DB&&window.__PSOnlineInstalled&&document.getElementById('boot').classList.contains('hidden'),{timeout:60000});await page.evaluate(()=>document.getElementById('tap-start')?.click());await page.waitForFunction(()=>G.DB.save);};
  await page.goto(url);await boot();
  await page.evaluate(()=>{G.DB.save.partner=25;G.DB.save.owned[25]={at:1,from:'starter'};G.DB.save.coins=1000;G.DB.commit(true);G.Flow.goMenu();});
  const play=async()=>{await page.evaluate(()=>document.querySelector('#scr-menu [data-go=play]').click());await page.waitForFunction(()=>G.Game.state==='playing');};
  // 1) Killed mid-run.
  await play();
  await page.evaluate(()=>{G.Game.debugTime(120);const p=G.Game.player;p.kills=40;p.bosses=1;p.coins=25;});
  await page.waitForTimeout(9000);
  const cp=await page.evaluate(()=>G.RunRescue.read());
  const before=await page.evaluate(()=>({coins:G.DB.save.coins,runs:G.DB.save.stats.runs}));
  await page.goto(url);await boot(); // "crash": the run never ended
  await page.waitForFunction(()=>!G.RunRescue.read(),{timeout:15000});
  const after=await page.evaluate(()=>({coins:G.DB.save.coins,runs:G.DB.save.stats.runs,toast:(document.querySelector('.toast')||{}).textContent||''}));
  const expected=Math.round((Math.floor(cp.time/5)+Math.floor(0.25*cp.kills)+80*cp.bosses+cp.coins)*cp.coinMul);
  // 2) Normal end: no checkpoint left, nothing paid on the next start.
  await page.evaluate(()=>G.Flow.goMenu());await play();
  await page.evaluate(()=>{G.Game.debugTime(90);});await page.waitForTimeout(9000);
  const had=!!(await page.evaluate(()=>G.RunRescue.read()));
  await page.evaluate(()=>G.Game.quit());await page.waitForTimeout(800);
  const cleared=await page.evaluate(()=>!G.RunRescue.read());
  const coinsAfterQuit=await page.evaluate(()=>G.DB.save.coins);
  await page.goto(url);await boot();await page.waitForTimeout(3000);
  const coinsNext=await page.evaluate(()=>G.DB.save.coins);
  console.log({cp,before,after,expected,had,cleared,coinsAfterQuit,coinsNext,errors});
  assert(cp&&cp.time>=120&&cp.kills>=40,'checkpoint written during the run');
  assert.equal(after.coins-before.coins,expected,'interrupted run paid with the game formula');
  assert.equal(after.runs,before.runs+1,'run counted');
  assert.match(after.toast,/补发|added|se te dan/);
  assert(had&&cleared,'normal end clears the checkpoint');
  assert.equal(coinsNext,coinsAfterQuit,'no double payment after a normal end');
  assert.deepEqual(errors,[]);
  console.log('Run rescue: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
