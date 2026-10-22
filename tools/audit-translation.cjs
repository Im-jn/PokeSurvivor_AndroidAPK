const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:432},locale:'zh-CN'}),report={},errors=[];
  const online=process.argv.includes('--online');
  page.on('pageerror',e=>errors.push(String(e)));
  if(online){
    await page.addInitScript(()=>{window.AndroidApp={getCutoutInsets:()=> '0,0,0,0,1',openOffline(){},openOnline(){},exit(){}};});
    const resources=JSON.parse(fs.readFileSync('source/online/local-resources.json','utf8'));
    await page.route('**/*',async route=>{const u=new URL(route.request().url()),r=resources[u.origin+u.pathname];if(r)return route.fulfill({contentType:r.mime,body:fs.readFileSync('source/'+r.file)});return route.continue();});
    await page.route('https://pokesurvivor.com/js/app.min.js*',async route=>{const r=await route.fetch();return route.fulfill({response:r,body:fs.readFileSync('source/online/bridge-prefix.js','utf8')+'\n'+await r.text()});});
  }
  await page.goto(online?'https://pokesurvivor.com/en/':pathToFileURL(path.resolve('source/index.html')).href+'?offline');await page.waitForFunction(()=>window.G&&G.Game&&document.getElementById('boot').classList.contains('hidden'));
  if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
  if(online)await page.locator('#btn-guest').click();
  await page.evaluate(()=>{G.DB.save.partner=25;G.DB.save.owned[25]={at:1};G.Flow.goMenu();});
  await page.evaluate(()=>{const box=document.createElement('div');box.id='translation-regression';box.innerHTML='<input placeholder="Nombre" title="Volver" value="Pikachu"><span translate="no">Pikachu</span><p>Nueva etiqueta de prueba</p>';document.body.appendChild(box);});
  await page.waitForTimeout(100);
  const fields=await page.evaluate(()=>{
    const box=document.getElementById('translation-regression'),input=box.querySelector('input');
    G.I18n.add({'Nueva etiqueta de prueba':'动态标签测试'});G.I18n.walk(box);
    const r={placeholder:input.placeholder,expected:G.T('Nombre'),title:input.title,value:input.value,nickname:box.querySelector('span').textContent,label:box.querySelector('p').textContent};box.remove();return r;
  });
  assert.match(fields.placeholder,/\p{Script=Han}/u);assert.equal(fields.title,'返回');assert.equal(fields.value,'Pikachu');assert.equal(fields.nickname,'Pikachu');assert.equal(fields.label,'动态标签测试');
  async function scan(name){await page.waitForTimeout(80);report[name]=await page.evaluate(()=>{
    const out=new Set(),tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while(n=tw.nextNode()){
      const p=n.parentElement;if(!p||p.closest('.hidden,script,style,input,textarea,code,pre')||(!p.closest('#news-body')&&p.closest('[translate="no"]')))continue;
      const text=n.nodeValue.replace(/\s+/g,' ').trim();if(/[a-zÀ-ž]{2}/i.test(text)&&p.getClientRects().length)out.add(text);
    }
    for(const el of document.querySelectorAll('[title],[placeholder],[aria-label]')){
      if(el.closest('.hidden,[translate="no"],script,style')||!el.getClientRects().length)continue;
      for(const key of ['title','placeholder','aria-label']){const value=el.getAttribute(key);if(value&&/[a-zÀ-ž]{2}/i.test(value))out.add(value);}
    }
    return [...out];
  });}
  await scan('menu');
  for(const action of ['dex','upgrades','gacha','goals']){
    await page.evaluate(()=>G.Flow.goMenu());await page.locator('#scr-menu [data-go='+action+']').click();await scan(action);
    const tabs=page.locator('.scr:not(.hidden) .gen-tab');
    for(let i=0;i<await tabs.count();i++){await tabs.nth(i).click();await scan(action+'-'+i);}
  }
  for(const tab of ['gfx','snd','ctl','map','acc']){await page.evaluate(t=>G.SettingsUI.open(t),tab);await scan('settings-'+tab);await page.locator('#set-close').click();}
  await page.evaluate(()=>G.NewsUI.open());await scan('news');
  if(online)fs.writeFileSync('verification/current-online-changelog.json',JSON.stringify(await page.evaluate(()=>G.CHANGELOG),null,2));
  fs.writeFileSync('verification/translation-audit'+(online?'-online':'')+'.json',JSON.stringify({report,errors},null,2));
  const unique=[...new Set(Object.values(report).flat())];console.log(JSON.stringify({untranslated:unique,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
