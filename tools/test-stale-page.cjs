// A cached, outdated official page (old ?v=) must not keep the official
// updater announcing a new version: the prefix reloads it once under a fresh URL.
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}});
  const res=JSON.parse(fs.readFileSync(path.join(root,'source/online/local-resources.json'),'utf8'));
  const live=await (await page.request.get('https://pokesurvivor.com/version.json?t='+Date.now())).json();
  const html=await (await page.request.get('https://pokesurvivor.com/')).text();
  const liveV=(html.match(/app\.min\.js\?v=([0-9a-f]+)/)||[])[1];
  const oldV='0000000000';
  const stale=html.replace(new RegExp(liveV,'g'),oldV);
  const docs=[];
  await page.route('**/*',r=>{
    const req=r.request(),u=new URL(req.url());
    if(req.resourceType()==='document'&&u.origin==='https://pokesurvivor.com'){docs.push(u.pathname+u.search);if(!u.searchParams.get('fresh'))return r.fulfill({contentType:'text/html',body:stale});}
    const a=res[u.origin+u.pathname];if(a&&!a.versioned)return r.fulfill({contentType:a.mime,body:fs.readFileSync(path.join(root,'source',a.file))});
    if(u.pathname==='/js/app.min.js'&&u.searchParams.get('v')===oldV)return r.fulfill({contentType:'application/javascript',body:u.searchParams.get('__ps_original')==='1'?'':fs.readFileSync(path.join(root,'source/online/client-loader.js'))});
    if(u.pathname==='/js/app.min.js'&&u.searchParams.get('__ps_original')!=='1')return r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'source/online/client-loader.js'))});
    if(u.pathname==='/sw.js')return r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'source/online/sw-reset.js'))});
    return r.continue();
  });
  await page.goto('https://pokesurvivor.com/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>location.search.includes('fresh=')&&window.G&&G.Updater,{timeout:60000});
  await page.evaluate(()=>G.Updater.check());await page.waitForTimeout(2500);
  const state=await page.evaluate(()=>({url:location.pathname+location.search,version:G.Updater.version,pending:G.Updater.pending}));
  console.log({live:live.v,docs,state});
  assert.equal(state.version,live.v,'fresh page runs the current version');
  assert.equal(state.pending,false,'no endless "new version" prompt');
  assert.equal(docs.filter(d=>d.includes('fresh=')).length,1,'only one extra reload');
  console.log('Stale page refresh: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
