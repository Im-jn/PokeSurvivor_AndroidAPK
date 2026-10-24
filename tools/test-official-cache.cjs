// After an official update: the new official client is downloaded once (with
// progress, patched), kept by the APK and served from it on the next start.
// Models the native side: AndroidApp.hasOfficial/storeOfficial/startupProgress
// and OfficialCache serving kept files. Uses the live official site.
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,locale:'zh-CN'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const res=JSON.parse(fs.readFileSync(path.join(root,'source/online/local-resources.json'),'utf8'));
  const kept=new Map(),served=[],network=[];let pings=0;
  await page.exposeBinding('__nativeStore',(_,p,v,text)=>{kept.set(p+'@'+v,text);});
  await page.exposeBinding('__nativePing',()=>{pings++;});
  await page.addInitScript(()=>{
    const keys=new Set(JSON.parse(localStorage.getItem('test.kept')||'[]'));
    window.AndroidApp={getCutoutInsets:()=>'0,0,0,0,2',openOffline(){window.__offline=1;},openOnline(){},exit(){},
      hasOfficial:(p,v)=>keys.has(p+'@'+v),
      storeOfficial:(p,v,t)=>{window.__nativeStore(p,v,t);keys.add(p+'@'+v);localStorage.setItem('test.kept',JSON.stringify([...keys]));return true;},
      dropOfficial:(p,v)=>{keys.delete(p+'@'+v);localStorage.setItem('test.kept',JSON.stringify([...keys]));},
      startupProgress:()=>window.__nativePing()};
  });
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url()),v=u.searchParams.get('v');
    if(u.hostname==='pokesurvivor.com'){
      if(u.pathname==='/sw.js')return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path.join(root,'source/online/sw-reset.js'),'utf8')});
      const original=u.searchParams.get('__ps_original')==='1';
      // Native order: bundled build, kept copy, loader for the plain app.min.js.
      const bundled=res[u.origin+u.pathname+'?v='+v];
      if(bundled&&(u.pathname!=='/js/app.min.js'||original))return route.fulfill({status:200,contentType:bundled.mime,body:fs.readFileSync(path.join(root,'source',bundled.file))});
      const k=kept.get(u.pathname+'@'+v);
      if(k&&(u.pathname!=='/js/app.min.js'||original)){served.push(u.pathname);return route.fulfill({status:200,contentType:u.pathname.endsWith('.css')?'text/css':'application/javascript',body:k});}
      if(u.pathname==='/js/app.min.js'&&!original)return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path.join(root,'source/online/client-loader.js'),'utf8')});
      if(/\.(js|css)$/.test(u.pathname))network.push(u.pathname+(original?'*':''));
    }
    const item=res[u.origin+u.pathname];
    if(item)return route.fulfill({status:200,contentType:item.mime,body:fs.readFileSync(path.join(root,'source',item.file))});
    return route.continue();
  });
  const live=await (await fetch('https://pokesurvivor.com/version.json?t='+Date.now())).json();
  const bundledApp=(fs.readFileSync(path.join(root,'source/vendor/official/index.html'),'utf8').match(/app\.min\.js\?v=([\w-]+)/)||[])[1];
  const boot=async()=>{
    await page.goto('https://pokesurvivor.com/',{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.__PSOnlineInstalled||window.__PSOnlineInstallError,null,{timeout:90000});
    return page.evaluate(()=>({installed:!!window.__PSOnlineInstalled,error:window.__PSOnlineInstallError||null,failBox:!!document.getElementById('ps-enhancement-error'),box:!!document.getElementById('ps-official-download'),sheetCache:typeof window.__psSheetCache}));
  };
  const first=await boot();
  const afterFirst={kept:[...kept.keys()],pings,network:[...network]};
  await page.waitForTimeout(12000); // style sheet and language files kept after load
  const keptLater=[...kept.keys()];
  const app=[...kept.entries()].find(([k])=>k.startsWith('/js/app.min.js@'));
  const patched=!!app&&/__psSheetCache/.test(app[1])&&/__psWhiteCache/.test(app[1]);
  network.length=0;served.length=0;
  const second=await boot();
  await page.waitForTimeout(1500);
  const secondNetwork=[...network],secondServed=[...served];
  console.log({live:live.v,bundledApp,first,afterFirst,keptLater,patched,second,secondNetwork,secondServed,errors});
  if(live.v===bundledApp){console.log('Live official build equals the bundled one: nothing to download. SKIP');return;}
  assert(first.installed&&!first.failBox,'first start (download) installs the enhancements');
  assert(afterFirst.kept.includes('/js/app.min.js@'+live.v),'new client kept');assert(patched,'kept client has the memory patches');
  assert(afterFirst.pings>0,'download progress told the APK');
  assert(keptLater.some(k=>k.startsWith('/css/style.css@'))&&keptLater.some(k=>k.startsWith('/js/lang/')),'style and language kept');
  assert(second.installed&&!second.box,'second start: no download');
  assert(!secondNetwork.some(p=>/app\.min\.js\*|style\.css|\/lang\//.test(p)),'second start: official files not downloaded again');
  assert(secondServed.includes('/js/app.min.js'),'second start: client from the APK');
  assert.deepEqual(errors,[]);
  console.log('Official files kept across updates: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
