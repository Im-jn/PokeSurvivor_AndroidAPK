// Full-map prediction must match the live official generator exactly.
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve('source/index.html')).href+'?offline');
  await page.waitForFunction(()=>window.G&&G.DB&&document.getElementById('boot').classList.contains('hidden'));
  if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
  await page.waitForFunction(()=>G.DB.save);await page.evaluate(()=>{G.DB.save.partner=25;G.DB.save.owned[25]={at:1,from:'starter'};G.Flow.goMenu();});
  await page.waitForSelector('#scr-menu:not(.hidden)');
  await page.locator('#scr-menu [data-go=play]').click();await page.waitForFunction(()=>G.Game.state==='playing');await page.waitForTimeout(800);
  const before=await page.evaluate(()=>{const s=G.World.mapSample(-80,-80,160,160,true);return {unknown:[...s.terrain].filter(v=>v===3).length,predicted:s.props.filter(p=>p.predicted).length,setting:G.Settings.get('mapPredict'),hasArenaProp:'arena' in G.World};});
  console.log('FULL_MAP',before);
  assert.equal(before.unknown,0,'whole sampled area must be shown');assert(before.predicted>0);assert.equal(before.setting,true);assert(before.hasArenaProp);
  const results=[];
  for(const seed of [1,4242,984571,77]){
   const r=await page.evaluate(seed=>{
    G.World.reset(seed);
    const W=G.World,bad=[];let tiles=0,props=0;
    for(let ty=-100;ty<100;ty++)for(let tx=-100;tx<100;tx++){
     tiles++;const k=({floor:0,wall:1,liquid:2})[W.kindAt(tx*32+16,ty*32+16)];
     if(k!==W.mapPredictTerrain(tx,ty))bad.push(['t',tx,ty]);
    }
    const live=new Map();const cam={left:()=>-96*32,top:()=>-96*32,w:192*32,h:192*32,sees:()=>true};for(const p of W.visibleProps(cam))if(p.type!=='grass'&&Math.abs(p.tx)<95&&Math.abs(p.ty)<95)live.set(p.tx+','+p.ty,p.type+':'+p.kind);
    for(let ty=-94;ty<95;ty++)for(let tx=-94;tx<95;tx++){const s=W.mapPredictProp(tx,ty),key=tx+','+ty,want=live.get(key)||null,got=s?s.type+':'+s.kind:null;if(got)props++;if(got!==want&&!(Math.hypot(tx,ty)>99))bad.push(['p',tx,ty,got,want]);}
    return {seed,tiles,props,live:live.size,bad:bad.slice(0,5),badCount:bad.length};
   },seed);
   console.log('SEED',r);results.push(r);assert.equal(r.badCount,0,JSON.stringify(r));
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync('verification/map-predict-check.json',JSON.stringify({fullMapShown:true,before,results,errors},null,2));
  console.log('Full map prediction matches the official generator: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
