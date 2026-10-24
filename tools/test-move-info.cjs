// Move info on every move icon (shop, Upgrades, level-up cards, Pokédex) and
// forgetting a TM move from the Pokédex page (offline build).
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:450}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve('source/index.html')).href+'?offline');
  await page.waitForFunction(()=>window.G&&G.DB&&window.__PSOnlineInstalled&&document.getElementById('boot').classList.contains('hidden'),{timeout:60000});
  await page.evaluate(()=>document.getElementById('tap-start')?.click());await page.waitForFunction(()=>G.DB.save);
  const move=await page.evaluate(()=>{const s=G.DB.save;s.partner=25;s.owned[25]={at:1,from:'starter'};s.coins=99999;
    const m=G.Mons.learnable(25)[0];s.tms=s.tms||{};s.tms[m]=2;G.Mons.teach(25,m);G.DB.commit();G.Flow.goMenu();return m;});
  const tipState=()=>page.evaluate(()=>{const t=document.getElementById('ps-move-tip');return {shown:!t.hidden,text:t.innerText.replace(/\s+/g,' '),forget:!!t.querySelector('[data-ps-forget]')};});
  const close=async()=>{await page.mouse.click(5,445);await page.waitForTimeout(150);};
  const menu=async go=>{await page.evaluate(g=>{for(const b of document.querySelectorAll('.scr:not(.hidden) [data-back]'))b.click();G.Flow.goMenu();document.querySelector('#scr-menu [data-go='+g+']').click();},go);await page.waitForTimeout(500);};

  // Kecleon shop: tapping a TM icon shows the move, buys nothing.
  await menu('shop');
  const before=await page.evaluate(()=>({coins:G.DB.save.coins,tms:JSON.stringify(G.DB.save.tms)}));
  const shopIcon=page.locator('#scr-shop:not(.hidden) [data-ps-move], .scr:not(.hidden) [data-ps-move]').first();
  await page.waitForTimeout(1500);await shopIcon.scrollIntoViewIfNeeded();await page.waitForTimeout(800);await shopIcon.click();await page.waitForTimeout(200);
  const shop=await tipState();await page.screenshot({path:'verification/move-tip-shop.png'});
  const after=await page.evaluate(()=>({coins:G.DB.save.coins,tms:JSON.stringify(G.DB.save.tms)}));
  await close();

  // Upgrades: starting-move chips.
  await menu('upgrades');
  await page.evaluate(()=>{const s=document.getElementById('upg-mon');s.value='25';s.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(300);
  // Buy "Starting move": its move chips appear.
  await page.evaluate(()=>{const row=[...document.querySelectorAll('#scr-upgrades *')].find(e=>e.children.length&&/^(初始招式|Starting move|Movimiento inicial)/.test(e.innerText.trim())&&e.querySelector('button'));row.querySelector('button').click();});
  await page.waitForTimeout(400);
  // ...then "Choose" opens them.
  await page.evaluate(()=>{const row=[...document.querySelectorAll('#scr-upgrades .upg-item')].find(e=>/^(初始招式|Starting move|Movimiento inicial)/.test(e.innerText.trim().split('\n').find(Boolean)||''))||[...document.querySelectorAll('#scr-upgrades .upg-item')].find(e=>/初始招式/.test(e.innerText)&&!/第二/.test(e.innerText));row.querySelector('button').click();});
  await page.waitForTimeout(400);
  const pstartBefore=await page.evaluate(()=>JSON.stringify(G.DB.save.pstart||{}));
  const upgIcons=await page.locator('#scr-upgrades [data-ps-move]').count();
  let upg={shown:false};
  if(upgIcons){const i=page.locator('#scr-upgrades [data-ps-move]').first();await i.scrollIntoViewIfNeeded();await i.click();await page.waitForTimeout(200);upg=await tipState();upg.pstartSame=(await page.evaluate(()=>JSON.stringify(G.DB.save.pstart||{})))===pstartBefore;await page.screenshot({path:'verification/move-tip-upgrades.png'});await close();}

  // Pokédex: the taught move can be forgotten (two taps).
  await menu('dex');
  await page.evaluate(()=>[...document.querySelectorAll('#dex-grid > .cell')].find(c=>+c.querySelector('.no').textContent===25).click());await page.waitForTimeout(300);
  const taughtIcon=page.locator(`#dex-detail .mx-row [data-ps-move="${move}"]`).first();
  await taughtIcon.scrollIntoViewIfNeeded();await taughtIcon.click();await page.waitForTimeout(200);
  const dexTip=await tipState();await page.screenshot({path:'verification/move-tip-forget.png'});
  await page.locator('#ps-move-tip [data-ps-forget]').click();await page.waitForTimeout(100);
  const armed=await tipState();
  const stillTaught=await page.evaluate(m=>G.Mons.taught(25).includes(m),move);
  await page.locator('#ps-move-tip [data-ps-forget]').click();await page.waitForTimeout(400);
  const forgot=await page.evaluate(m=>({taught:G.Mons.taught(25).includes(m),ptm:JSON.stringify(G.DB.save.ptm),row:!!document.querySelector(`#dex-detail .mx-row [data-ps-move="${m}"]`),tms:G.DB.save.tms[m]||0,stored:JSON.parse(localStorage.getItem('ps.forgottenTm'))}),move);
  // A merge with an older cloud copy brings it back: removed again.
  await page.evaluate(m=>{G.DB.save.ptm[25]=(G.DB.save.ptm[25]||[]).concat(m);},move);
  await page.waitForTimeout(4600);
  const resurrected=await page.evaluate(m=>G.Mons.taught(25).includes(m),move);
  // Teaching it again is respected.
  const retaught=await page.evaluate(m=>{const ok=G.Mons.teach(25,m);return ok;},move);
  await page.waitForTimeout(4600);
  const kept=await page.evaluate(m=>G.Mons.taught(25).includes(m),move);
  // Not taught moves (the natural pool) have no forget button.
  await page.evaluate(()=>{const c=[...document.querySelectorAll('#dex-grid > .cell')].find(c=>+c.querySelector('.no').textContent===25);c.click();});await page.waitForTimeout(300);
  const pool=page.locator(`#dex-detail p [data-ps-move]`).first();await pool.scrollIntoViewIfNeeded();await pool.click();await page.waitForTimeout(200);
  const poolTip=await tipState();await close();

  // Level-up cards in a run: icon shows info, the choice stays open.
  await page.evaluate(()=>{for(const b of document.querySelectorAll('.scr:not(.hidden) [data-back]'))b.click();G.Flow.goMenu();document.querySelector('#scr-menu [data-go=play]').click();});
  await page.waitForFunction(()=>G.Game.state==='playing',{timeout:20000});
  await page.evaluate(()=>G.Game.debugLevelUp());
  await page.waitForFunction(()=>document.querySelector('#scr-levelup:not(.hidden) [data-ps-move]'),{timeout:10000});
  await page.locator('#scr-levelup:not(.hidden) [data-ps-move]').first().click();await page.waitForTimeout(200);
  const lv=await tipState();const lvOpen=await page.evaluate(()=>!document.getElementById('scr-levelup').classList.contains('hidden'));
  await page.screenshot({path:'verification/move-tip-levelup.png'});

  console.log({move,shop,before,after,upgIcons,upg,dexTip,armed,stillTaught,forgot,resurrected,retaught,kept,poolTip,lv,lvOpen,errors});
  assert(shop.shown&&shop.text.length>10,'shop icon shows the move');assert.deepEqual(after,before,'tapping the icon buys nothing');
  assert(upgIcons>0&&upg.shown&&upg.pstartSame,'upgrades icons show the move without choosing it');
  assert(dexTip.shown&&dexTip.forget,'taught move offers forgetting');
  assert(armed.text.includes('再点一次')&&stillTaught,'first tap only asks for confirmation');
  assert(!forgot.taught&&!forgot.row,'move forgotten and page refreshed');assert.equal(forgot.tms,1,'TM not refunded');
  assert(!resurrected,'a synced copy cannot bring it back');
  assert(retaught&&kept,'teaching it again keeps it');
  assert(poolTip.shown&&!poolTip.forget,'natural moves cannot be forgotten');
  assert(lv.shown&&!lv.forget&&lvOpen,'level-up icon shows info, the choice stays open');
  assert.deepEqual(errors,[]);
  console.log('Move info + forget TM: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
