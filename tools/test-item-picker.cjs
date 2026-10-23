// Ability Patch bought in the Kecleon Shop: its button sits in the Ability row
// of an owned Pokémon's page; the choices it opens must be scrolled into view.
const root=require('node:path').resolve(__dirname,'..'),out=root+'/verification';const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');const assert=require('node:assert/strict');
const path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
const page=await b.newPage({viewport:{width:1000,height:450}});const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto(pathToFileURL(path.join(root,'source/index.html')).href+'?offline');
await page.waitForFunction(()=>window.G&&G.DB&&window.__PSOnlineInstalled&&document.getElementById('boot').classList.contains('hidden'),{timeout:60000});
await page.evaluate(()=>document.getElementById('tap-start')?.click());await page.waitForFunction(()=>G.DB.save);
await page.evaluate(()=>{G.DB.save.partner=4;for(const d of [4,25,7,809])G.DB.save.owned[d]={at:1,from:'starter'};G.DB.save.coins=20000;G.DB.commit(true);G.Flow.goMenu();});
// Buy one ability patch in the shop (5,000).
await page.evaluate(()=>document.querySelector('#scr-menu [data-go=shop]').click());await page.waitForTimeout(800);
await page.evaluate(()=>{const b=[...document.querySelectorAll('#scr-shop button')].find(x=>/5,000|5\.000/.test(x.textContent));b&&b.click();});await page.waitForTimeout(400);
await page.evaluate(()=>{const ok=[...document.querySelectorAll('button')].find(b=>b.offsetParent&&/^(购买|确定|Comprar|Buy)$/.test(b.textContent.trim()));ok&&ok.click();});await page.waitForTimeout(400);
const owned=await page.evaluate(()=>({caph:G.Shop.count('caph'),coins:G.DB.save.coins}));
await page.evaluate(()=>document.querySelector('#scr-shop [data-back]').click());
await page.evaluate(()=>document.querySelector('#scr-menu [data-go=dex]').click());await page.waitForTimeout(500);
const res={};
for(const id of [4,25,7]){
  await page.evaluate(id=>[...document.querySelectorAll('#dex-grid > .cell')].find(c=>+c.querySelector('.no').textContent===id).click(),id);await page.waitForTimeout(300);
  res[id]=await page.evaluate(id=>({choicesAll:G.Mons.abilityChoices(id,true).length,choicesNormal:G.Mons.abilityChoices(id,false).length,ability:G.Mons.abilityOf(id),row:(document.querySelector('#dex-detail .mon-extra .mx-row:nth-child(2)')||{}).innerText,buttons:[...document.querySelectorAll('#dex-detail [data-extra]')].map(b=>b.dataset.extra+':'+b.textContent.trim())}),id);
}
// Melmetal (#809) has one ability: a note instead of a button.
await page.evaluate(()=>{const q=document.getElementById('dex-q');q.value='809';q.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(300);
await page.evaluate(()=>[...document.querySelectorAll('#dex-grid > .cell')].find(c=>+c.querySelector('.no').textContent===809).click());await page.waitForTimeout(300);
const mel=await page.evaluate(()=>({note:(document.querySelector('#dex-detail .ps-ability-note')||{}).textContent||null,btnPos:[...document.querySelectorAll('#dex-detail .mon-extra .btn')].map(b=>getComputedStyle(b).position)}));
await page.evaluate(()=>{const c=document.querySelector('#dex-detail .ps-dex-content');c.scrollTop=c.scrollHeight;});await page.screenshot({path:out+'/item-one-ability.png'});
console.log(JSON.stringify(mel));assert(mel.note,'one-ability note');assert(mel.btnPos.every(p=>p==='static'),'item buttons stay in their row');
await page.evaluate(()=>{const q=document.getElementById('dex-q');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(300);
await page.evaluate(()=>[...document.querySelectorAll('#dex-grid > .cell')].find(c=>+c.querySelector('.no').textContent===25).click());await page.waitForTimeout(300);
const btn=page.locator('#dex-detail [data-extra=caph]');
const pos=await page.evaluate(()=>{const b=document.querySelector('#dex-detail [data-extra=caph]');return b&&getComputedStyle(b).position;});assert.equal(pos,'static','item button stays in its row, not sticky');
if(await btn.count()){await btn.scrollIntoViewIfNeeded();await page.screenshot({path:out+'/item-patch-button.png'});await btn.click();await page.waitForTimeout(600);await page.screenshot({path:out+'/item-patch-click.png'});
  res.after=await page.evaluate(()=>({ability:G.Mons.abilityOf(25),caph:G.Shop.count('caph'),
    fixed:[...document.querySelectorAll('body *')].filter(e=>e.offsetParent!==null&&getComputedStyle(e).position==='fixed'&&e.innerText&&!/topbar|toast/.test(e.id+e.className)).map(e=>(e.id||e.className)+': '+e.innerText.replace(/\s+/g,' ').slice(0,200)).slice(0,6),
    detailTop:document.querySelector('#dex-detail').innerText.replace(/\s+/g,' ').slice(0,200)}));
  const choice=await page.evaluate(()=>{const c=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/静电|避雷针|Electricidad|Pararrayos/.test(b.textContent));return c.map(b=>b.textContent.trim()+' | btn.class='+b.className+' | data='+JSON.stringify(b.dataset)+' | parent='+b.parentElement.className+' | gp='+b.parentElement.parentElement.className+' | scrollTop='+document.querySelector('#dex-detail .ps-dex-content').scrollTop);});
  res.choices=choice;
  await page.waitForTimeout(800);
  res.pickerVisible=await page.evaluate(()=>{const pk=document.querySelector('#dex-detail .ban-picker'),box=document.querySelector('#dex-detail .ps-dex-content')||document.getElementById('dex-detail');if(!pk)return null;const a=pk.getBoundingClientRect(),b=box.getBoundingClientRect();return a.top>=b.top-2&&a.top<b.bottom-20;});
  await page.screenshot({path:out+'/item-patch-picker.png'});
  res.desc=await page.evaluate(()=>{const c=[...document.querySelectorAll('#dex-detail .ban-picker .chip')].find(b=>b.dataset.v==='2');const d=c&&c.querySelector('.ps-ability-desc');return d&&d.textContent;});
  res.btnH=await page.evaluate(()=>Math.round(document.querySelector('#dex-detail [data-extra=caph]')?.getBoundingClientRect().height||0));
  await page.evaluate(()=>[...document.querySelectorAll('#dex-detail .ban-picker .chip')].find(b=>b.dataset.v==='2').click());await page.waitForTimeout(500);
  res.used=await page.evaluate(()=>({ability:G.Mons.abilityOf(25),caph:G.Shop.count('caph')}));}
console.log(JSON.stringify({owned,desc:res.desc,picker:res.pickerVisible,used:res.used,errs}));
assert.equal(owned.caph,1,'patch bought');assert(res[25].buttons.some(b=>b.startsWith('caph:')),'patch button in the Ability row');
assert.equal(res.pickerVisible,true,'choices scrolled into view');assert(res.desc&&/[一-鿿]/.test(res.desc),'ability choice shows its effect: '+res.desc);assert.equal(res.used.ability.slot,2,'hidden ability applied');assert.equal(res.used.caph,0,'patch consumed');assert.deepEqual(errs,[]);console.log('Item picker: PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
