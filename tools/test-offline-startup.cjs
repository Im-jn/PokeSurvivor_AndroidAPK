const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[],cloud=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/firebase|googleapis|gstatic/.test(r.url()))cloud.push(r.url());});
  const url=pathToFileURL(path.resolve('source/index.html')).href;
  await page.goto(url+'?offline');
  await page.waitForFunction(()=>window.G&&G.DB&&document.getElementById('boot').classList.contains('hidden'));
  if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
  await page.waitForFunction(()=>G.DB.guest&&G.DB.save);
  assert.equal(await page.evaluate(()=>G.DB.mode),'local');assert(!await page.locator('#scr-login').isVisible());
  await page.evaluate(()=>G.Flow.toLogin());assert(!await page.locator('#scr-login').isVisible());
  await page.evaluate(()=>{G.DB.save.partner=25;G.DB.save.owned[25]={at:1,from:'starter'};G.Flow.goMenu();G.DB.save.coins=4242;G.DB.commit(true);});
  const stored=await page.evaluate(()=>localStorage.getItem('ps.save.guest'));
  await page.goto(url+'?offline&auto=timeout');await page.waitForFunction(()=>window.G&&G.DB&&document.getElementById('boot').classList.contains('hidden'));
  if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
  await page.waitForSelector('#scr-menu:not(.hidden)');assert.equal(await page.evaluate(()=>G.DB.save.coins),4242);
  assert.equal(await page.evaluate(()=>G.DB.save.partner),25);
  const before=JSON.parse(stored),after=JSON.parse(await page.evaluate(()=>localStorage.getItem('ps.save.guest')));
  delete before.updated;delete after.updated;assert.deepEqual(after,before);
  assert.deepEqual(cloud,[]);assert.deepEqual(errors,[]);
  assert(await page.evaluate(()=>__PSOnlineInstalled.officialGameUnchanged&&!!G.Judgment));
  const failedAssets=[];page.on('requestfailed',r=>failedAssets.push({url:r.url(),failure:r.failure()}));
  await page.locator('#scr-menu [data-go=play]').click();await page.waitForFunction(()=>G.Game.state==='playing');await page.waitForTimeout(700);
  await page.keyboard.press('m');await page.waitForFunction(()=>G.MapUI.isOpen);
  const time=await page.evaluate(()=>G.Game.st.time);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>G.Game.st.time),time);
  await page.keyboard.press('Escape');await page.evaluate(()=>G.Game.debugTime(1799.9));
  await page.waitForFunction(()=>G.Judgment.active||G.Judgment.cinematic,{timeout:15000});await page.waitForTimeout(1500);
  assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);assert.deepEqual(cloud,[]);
  const judgment=await page.evaluate(()=>({time:G.Game.st.time,active:G.Judgment.active,cinematic:G.Judgment.cinematic}));
  await page.screenshot({path:'verification/offline-auto-startup.png'});
  fs.writeFileSync('verification/offline-startup-check.json',JSON.stringify({manualOfflineSkipsLogin:true,autoGuestOnFreshInstall:true,existingGuestPreserved:true,mapPauses:true,judgment,failedAssets,cloudRequests:cloud.length,errors},null,2));console.log('Offline entry, save preservation, map pause and Arceus at 30 minutes: PASS',judgment);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
