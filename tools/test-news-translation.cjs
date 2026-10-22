const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),assert=require('node:assert/strict');
(async()=>{
 const online=process.argv.includes('--online'),live=process.argv.includes('--live');
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:432},locale:'zh-CN'}),errors=[],requested=[];let fail=false;
  page.on('pageerror',e=>errors.push(String(e)));
  if(online){
    await page.addInitScript(()=>{window.AndroidApp={getCutoutInsets:()=> '0,0,0,0,1',openOffline(){},openOnline(){},exit(){}};});
    const resources=JSON.parse(fs.readFileSync('source/online/local-resources.json','utf8'));
    await page.route('**/*',async route=>{const u=new URL(route.request().url()),r=resources[u.origin+u.pathname];if(r)return route.fulfill({contentType:r.mime,body:fs.readFileSync('source/'+r.file)});return route.continue();});
    await page.route('https://pokesurvivor.com/js/app.min.js*',async route=>{const r=await route.fetch();return route.fulfill({response:r,body:fs.readFileSync('source/online/bridge-prefix.js','utf8')+'\n'+await r.text()});});
  }
  await page.route('https://api.mymemory.translated.net/get*',async route=>{
    const text=new URL(route.request().url()).searchParams.get('q');requested.push(text);
    if(live)return route.continue();
    if(fail)return route.fulfill({status:503,body:'unavailable',headers:{'access-control-allow-origin':'*'}});
    const translations={'New game updates':'游戏更新','New game updates are available.':'有新的游戏更新。','A new boss arrives.':'新增一位首领。','Another new mode.':'新增另一种模式。'};
    return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({responseStatus:200,responseData:{translatedText:translations[text]||'公开更新内容'}})});
  });
  await page.goto(online?'https://pokesurvivor.com/en/':pathToFileURL(path.resolve('source/index.html')).href+'?offline');
  await page.waitForFunction(()=>window.G&&G.Game&&document.getElementById('boot').classList.contains('hidden'));
  if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
  if(online)await page.locator('#btn-guest').click();
  await page.evaluate(actual=>{
    G.DB.save.partner=25;G.DB.save.owned[25]={at:1};G.Flow.goMenu();
    if(actual){const latest=G.CHANGELOG[0],first=['new','chg','fix'].flatMap(k=>latest[k]||[])[0];G.CHANGELOG=[{d:latest.d,title:latest.title,chg:[first]}];}
    else G.CHANGELOG=[{d:'2026-10-18',title:['Actualizaciones','New game updates'],new:[['Hay novedades.','New game updates are available.']]}];
    G.NewsUI.open();
  },live);
  await page.waitForFunction(()=>/\p{Script=Han}/u.test(document.querySelector('#news-body li').textContent),{timeout:45000});
  await page.waitForFunction(()=>/\p{Script=Han}/u.test(document.querySelector('#news-body h3 > span').textContent),{timeout:45000});
  assert.equal(requested.length,2);assert(requested.every(s=>!s.includes('password')));
  if(!live){
    await page.evaluate(()=>{G.NewsUI.close();G.NewsUI.open();});await page.waitForTimeout(200);assert.equal(requested.length,2);
    await page.evaluate(()=>{G.NewsUI.close();G.CHANGELOG[0].new.push(['Nuevo jefe.','A new boss arrives.']);G.NewsUI.open();});
    await page.waitForFunction(()=>document.querySelector('#news-body').textContent.includes('新增一位首领'));assert.equal(requested.length,3);
    await page.locator('#news-original-toggle').click();assert((await page.locator('#news-body').innerText()).includes('A new boss arrives.'));
    await page.locator('#news-original-toggle').click();assert((await page.locator('#news-body').innerText()).includes('新增一位首领'));
    fail=true;await page.evaluate(()=>{G.NewsUI.close();G.CHANGELOG[0].new.push(['Otro modo.','Another new mode.']);G.NewsUI.open();});
    await page.waitForSelector('#news-translation-retry:not(.hidden)');assert((await page.locator('#news-body').innerText()).includes('Another new mode.'));
    fail=false;await page.locator('#news-translation-retry').click();await page.waitForFunction(()=>document.getElementById('news-body').textContent.includes('新增另一种模式'));
  }
  assert.deepEqual(errors,[]);await page.screenshot({path:'verification/news-translation'+(online?'-online':'')+(live?'-live':'')+'.png'});
  const result={online,live,publicNoteRequests:requested.length,body:await page.locator('#news-body').innerText(),errors};
  fs.writeFileSync('verification/news-translation'+(online?'-online':'')+(live?'-live':'')+'.json',JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
