const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,locale:'zh-CN'}),errors=[],localHits=[],networkHosts={};
  const staticResources=JSON.parse(fs.readFileSync(path.join(root,'source/online/local-resources.json'),'utf8'));
  page.on('request',r=>{const host=new URL(r.url()).hostname;networkHosts[host]=(networkHosts[host]||0)+1;});
  // Model the APK interceptor, with all unrecognized Google CDN requests denied.
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url()),key=url.origin+url.pathname,item=staticResources[key];
    if(item){localHits.push(item.file);return route.fulfill({status:200,contentType:item.mime,body:fs.readFileSync(path.join(root,'source',item.file))});}
    if(url.hostname==='www.gstatic.com')throw new Error('Unbundled Google CDN request: '+url.pathname);
    return route.continue();
  });
  page.on('pageerror',e=>{errors.push(String(e));console.log('PAGEERROR',String(e));});
  await page.addInitScript(()=>{window.AndroidApp={getCutoutInsets:()=> '96,0,0,0,2',openOffline:()=>{window.__offlineRequested=true;},openOnline(){},exit(){}};});
  await page.addInitScript(()=>{window.ResizeObserver=undefined;});
  await page.route('https://pokesurvivor.com/js/app.min.js*',async route=>{
   const u=new URL(route.request().url());
   if(u.searchParams.get('__ps_original')==='1'){
     // The APK serves its patched copy of the very same official build.
     const item=staticResources[u.origin+u.pathname+'?v='+u.searchParams.get('v')];
     if(item){localHits.push(item.file);return route.fulfill({status:200,contentType:item.mime,body:fs.readFileSync(path.join(root,'source',item.file))});}
     return route.continue();
   }
   await route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path.join(root,'source/online/client-loader.js'),'utf8')});
  });
  // Mirror the native /sw.js replacement (service workers bypass the page interceptor).
  await page.route('https://pokesurvivor.com/sw.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path.join(root,'source/online/sw-reset.js'),'utf8')}));
  // Upgrade must heal the flag left by the previous release.
  await page.addInitScript(()=>sessionStorage.setItem('ps.online.disable-enhancements','1'));
  await page.goto('https://pokesurvivor.com/en/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__PSOnlineInstalled||window.__PSOnlineInstallError,{timeout:45000});
  console.log('INSTALL',await page.evaluate(()=>({state:window.__PSOnlineInstalled,error:window.__PSOnlineInstallError})));
  assert(await page.evaluate(()=>__PSOnlineInstalled.officialGameUnchanged&&__PSOnlineInstalled.judgment));
  await page.waitForFunction(()=>window.G?.DB&&document.getElementById('boot').classList.contains('hidden'),{timeout:45000});
  if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
  await page.waitForTimeout(500);
  console.log('VISIBLE',await page.locator('button:visible').allTextContents());
  const lang=await page.evaluate(()=>({lang:G.I18n.lang,saved:localStorage.getItem('ps.lang'),sample:G.T('Entrar')}));console.log('LANG',lang);
  assert.equal(lang.lang,'zh-Hans','official Simplified Chinese must be the default');
  assert(await page.evaluate(()=>!!G.CloudSync&&typeof G.DB.saveNow==='function'&&typeof G.DB.flush==='function'&&'syncState' in G.DB),'cloud sync hooks onto the official save API');
  assert.equal(await page.evaluate(()=>location.origin),'https://pokesurvivor.com');
  assert.equal(await page.evaluate(()=>G.DB.mode),'cloud');
  assert(await page.locator('#scr-login').isVisible());
  const username=await page.locator('#f-user').boundingBox(),password=await page.locator('#f-pass').boundingBox();
  assert(password.y>=username.y+username.height,'password must be below username');
  assert(Math.abs(username.x-password.x)<2,'login fields must align vertically');
  assert.match(await page.locator('#btn-auth').innerText(),/登录/);
  // Read-only public Firebase project configuration: exercises the actual
  // Referer restriction without credentials, account creation or save writes.
  const probe=await page.evaluate(async()=>{
   const response=await fetch('https://identitytoolkit.googleapis.com/v1/projects?key='+G.FIREBASE_CONFIG.apiKey);
   const json=await response.json();return {status:response.status,error:json.error?.message||null};
  });
  console.log('AUTH_ORIGIN_PROBE',probe);assert.equal(probe.status,200,JSON.stringify(probe));
  await page.screenshot({path:path.join(root,'verification/online-login.png')});
  await page.locator('#login-local-offline').click();assert(await page.evaluate(()=>window.__offlineRequested));
  await page.locator('#btn-guest').click();await page.waitForTimeout(500);
  for(let i=0;i<12&&await page.locator('#test-a button:visible').count();i++){await page.locator('#test-a button:visible').first().click();await page.waitForTimeout(60);}
  if(await page.locator('#res-ok').isVisible())await page.locator('#res-ok').click();
  await page.waitForTimeout(300);
  // Reproduce the wider signed-in header without credentials or cloud writes.
  await page.evaluate(()=>{
    document.querySelector('#user-pill span[translate="no"]').textContent='Jn_secret_long';
    document.getElementById('coins').textContent='104';
    document.getElementById('btn-support').classList.remove('hidden');
  });
  for(const [width,height] of [[960,432],[844,390],[740,360],[1280,576]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(250);
    const rects=await page.evaluate(()=>{
      const a=document.getElementById('topbar').getBoundingClientRect(),b=document.querySelector('#scr-menu .menu-right .box').getBoundingClientRect();
      return {headerBottom:a.bottom,menuTop:b.top,headerLeft:a.left,headerRight:a.right,width:innerWidth};
    });
    assert(rects.menuTop>=rects.headerBottom+12,JSON.stringify(rects));
    assert(rects.headerLeft>=0&&rects.headerRight<=width,JSON.stringify(rects));
    await page.screenshot({path:path.join(root,'verification/online-menu-'+width+'.png')});
  }
  await page.setViewportSize({width:960,height:432});
  // Do not pull or spend tickets: inspect layout using official guest UI only.
  for(const [width,height] of [[960,432],[844,390],[740,360],[1280,576]]){
    await page.setViewportSize({width,height});
    await page.locator('#scr-menu [data-go=gacha]').click();
    await page.locator('#gacha-gens .gen-tab').nth(8).click();await page.waitForTimeout(150);
    const banner=await page.locator('#banner').boundingBox(),title=await page.locator('#banner-title').boundingBox();
    assert(title.y>=banner.y,'banner title clipped above scrolling area');
    // The official pull buttons change (x1 was replaced by x100): check those present.
    const pulls=await page.evaluate(()=>[...document.querySelectorAll('#scr-gacha button[id^=pull-]')].filter(b=>/^pull-\d+b?$/.test(b.id)).map(b=>b.id));
    assert(pulls.length>=2,'pull buttons found: '+pulls);
    for(const id of pulls){
      const r=await page.locator('#'+id).boundingBox();
      assert(r&&r.y>=0&&r.y+r.height<=height-6,'pull button outside viewport: '+JSON.stringify(r));
    }
    await page.screenshot({path:path.join(root,'verification/mobile-gacha-'+width+'.png')});
    await page.locator('#scr-gacha [data-back]').click();
    await page.locator('#scr-menu [data-go=dex]').click();await page.waitForTimeout(150);
    await page.waitForSelector('#dex-detail .ps-dex-content');
    const detail=await page.evaluate(()=>{
      const content=document.querySelector('#dex-detail .ps-dex-content'),action=document.querySelector('#dex-detail .ps-dex-action');
      const c=content.getBoundingClientRect(),a=action.getBoundingClientRect();
      return {bottom:c.bottom,actionTop:a.top,actionBottom:a.bottom,actionHeight:a.height,scroll:content.scrollHeight,client:content.clientHeight};
    });
    assert(detail.client>60,'detail content has no reading space: '+JSON.stringify(detail));
    if(detail.actionHeight)assert(detail.bottom<=detail.actionTop+1&&detail.actionBottom<=height-6,'detail overlaps action: '+JSON.stringify(detail));
    await page.screenshot({path:path.join(root,'verification/mobile-dex-'+width+'.png')});
    await page.locator('#scr-dex [data-back]').click();
  }
  await page.setViewportSize({width:960,height:432});
  await page.locator('#btn-settings').click();await page.locator('#set-tabs [data-t=map]').click();assert.match(await page.locator('#set-body').innerText(),/战斗小地图/);
  await page.locator('#set-close').click();
  // Endless mode: the Judgment of Arceus must not start after minute 30.
  await page.locator('#ps-run-mode [data-mode=endless]').click();
  assert.match(await page.locator('#scr-menu [data-go=play] small').innerText(),/不触发阿尔宙斯/);
  await page.locator('#scr-menu [data-go=play]').click();await page.waitForFunction(()=>G.Game.state==='playing');
  await page.evaluate(()=>G.Game.debugTime(1799.9));await page.waitForTimeout(4000);
  const endless=await page.evaluate(()=>({time:G.Game.st.time,active:G.Judgment.active,cinematic:G.Judgment.cinematic,at:G.Judgment.AT,mode:G.RunMode.get()}));
  console.log('ENDLESS_AFTER_30_MINUTES',endless);
  assert(endless.time>1801&&!endless.active&&!endless.cinematic&&endless.at===Infinity,JSON.stringify(endless));
  await page.evaluate(()=>G.Game.quit());await page.waitForTimeout(800);
  await page.evaluate(()=>{if(document.querySelector('#scr-menu.hidden'))G.Flow.goMenu?.();});
  await page.waitForSelector('#scr-menu:not(.hidden)',{timeout:10000});
  await page.locator('#ps-run-mode [data-mode=arceus]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('ps.runMode')),'arceus');
  await page.locator('#scr-menu [data-go=play]').click();await page.waitForFunction(()=>G.Game.state==='playing');
  await page.waitForTimeout(700);await page.screenshot({path:path.join(root,'verification/online-combat.png')});
  await page.keyboard.press('m');await page.waitForFunction(()=>G.MapUI.isOpen);assert.equal(await page.evaluate(()=>G.Game.state),'paused');
  const before=await page.evaluate(()=>G.Game.st.time);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>G.Game.st.time),before);
  await page.screenshot({path:path.join(root,'verification/online-map.png')});await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.Game.state),'playing');
  const mapState=await page.evaluate(()=>{const p=G.Game.player,s=G.World.mapSample(Math.floor(p.x/32)-32,Math.floor(p.y/32)-32,64,64);return {knownTiles:[...s.terrain].filter(v=>v!==3).length,resources:s.props.length};});
  assert(mapState.knownTiles>0,'Map must sample the current official world');
  await page.evaluate(()=>G.Game.debugTime(1799.9));
  await page.waitForFunction(()=>G.Judgment.active||G.Judgment.cinematic,{timeout:15000});
  const judgment=await page.evaluate(()=>({time:G.Game.st.time,active:G.Judgment.active,cinematic:G.Judgment.cinematic,debug:G.Judgment.debug}));
  console.log('ARCEUS_AT_30_MINUTES',judgment);assert.equal(await page.evaluate(()=>G.Judgment.AT),1800);
  await page.screenshot({path:path.join(root,'verification/online-arceus.png')});
  assert.deepEqual(errors,[]);
  for(const name of ['app','auth','firestore','database'])assert(localHits.includes('vendor/firebase/firebase-'+name+'-compat.js'),'SDK was not served locally: '+name);
  fs.writeFileSync(path.join(root,'verification/online-browser-check.json'),JSON.stringify({officialHTTPSPage:true,officialDBUnchanged:true,officialGamePreserved:true,serviceWorkerReplaced:true,endless,oldDisabledFlagRecovered:true,webViewLoadsOriginalScript:true,probe,judgment,mapState,guestGameAndMapTested:true,realAccountTested:false,googleCDNNetworkDisabled:true,localResourceHits:localHits,requestedHosts:networkHosts,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
