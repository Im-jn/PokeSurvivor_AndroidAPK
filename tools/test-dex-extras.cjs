// Pokédex move info popup and Pokédex <-> Upgrades navigation (offline build).
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:450}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve('source/index.html')).href+'?offline');
  await page.waitForFunction(()=>window.G&&G.DB&&window.__PSOnlineInstalled&&document.getElementById('boot').classList.contains('hidden'),{timeout:60000});
  await page.evaluate(()=>document.getElementById('tap-start')?.click());await page.waitForFunction(()=>G.DB.save);
  await page.evaluate(()=>{G.DB.save.partner=4;for(const d of [1,4,25])G.DB.save.owned[d]={at:1,from:'starter'};G.Flow.goMenu();});
  await page.evaluate(()=>document.querySelector('#scr-menu [data-go=dex]').click());await page.waitForTimeout(500);
  // Select Pikachu (#025).
  await page.evaluate(()=>[...document.querySelectorAll('#dex-grid > .cell')].find(c=>+c.querySelector('.no').textContent===25).click());await page.waitForTimeout(300);
  // Move info popup.
  const icon=page.locator('#dex-detail .move-icons span[title]').first();await icon.scrollIntoViewIfNeeded();await icon.click();await page.waitForTimeout(200);
  const tip=await page.evaluate(()=>{const t=document.getElementById('ps-move-tip');return {shown:!t.hidden,text:t.innerText.replace(/\s+/g,' '),cat:!!t.querySelector('.ps-tip-cat')};});
  await page.screenshot({path:'verification/dex-move-tip.png'});
  await page.mouse.click(30,420);await page.waitForTimeout(150);
  const hidden=await page.evaluate(()=>document.getElementById('ps-move-tip').hidden);
  // Pokédex -> Upgrades on this Pokémon.
  await page.locator('#ps-dex-upgrades').click();await page.waitForTimeout(400);
  const upg=await page.evaluate(()=>({open:!document.getElementById('scr-upgrades').classList.contains('hidden'),mon:document.getElementById('upg-mon').value}));
  await page.screenshot({path:'verification/upgrades-from-dex.png'});
  // Back returns to the Pokédex page of the selected Pokémon.
  await page.locator('#scr-upgrades [data-back]').click();await page.waitForTimeout(500);
  const back=await page.evaluate(()=>({dex:!document.getElementById('scr-dex').classList.contains('hidden'),id:G.DexExtras.currentDex()}));
  // Upgrades -> "View in Pokédex" for another Pokémon.
  await page.locator('#scr-dex [data-back]').click();await page.evaluate(()=>document.querySelector('#scr-menu [data-go=upgrades]').click());await page.waitForTimeout(300);
  await page.evaluate(()=>{const s=document.getElementById('upg-mon');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#ps-upg-dex').click();await page.waitForTimeout(500);
  const view=await page.evaluate(()=>({dex:!document.getElementById('scr-dex').classList.contains('hidden'),id:G.DexExtras.currentDex()}));
  console.log({tip,hidden,upg,back,view,errors});
  assert(tip.shown&&tip.cat&&tip.text.length>10,'move popup with category');assert(hidden,'tap elsewhere closes the popup');
  assert(upg.open&&upg.mon==='25','upgrades open on the selected Pokémon');
  assert(back.dex&&back.id===25,'back returns to the same Pokédex page');
  assert(view.dex&&view.id===1,'upgrades -> Pokédex page of the selected Pokémon');
  assert.deepEqual(errors,[]);
  console.log('Pokédex extras: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
