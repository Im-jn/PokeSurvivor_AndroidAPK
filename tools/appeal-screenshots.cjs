// Screenshots of the author's own published licence terms, for a platform appeal.
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await b.newPage({viewport:{width:1100,height:900},locale:'zh-CN'});
  const stamp=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
  // Banner with URL and capture time (headless screenshots have no address bar).
  const banner=async url=>page.evaluate(([u,t])=>{const d=document.createElement('div');d.textContent='来源：'+u+'　截取时间：'+t+'（北京时间）';d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#111;color:#fff;font:14px sans-serif;padding:6px 10px';document.body.prepend(d);document.body.style.paddingTop='34px';},[url,stamp]);
  // 1) Licence on the official website, key sentence highlighted.
  // The site serves LICENSE as a download, so show its exact text (fetched live).
  const text=await (await page.request.get('https://pokesurvivor.com/LICENSE')).text();
  await page.setContent('<pre style="font:16px/1.45 Consolas,monospace;margin:12px;white-space:pre-wrap"></pre>');
  await page.evaluate(t=>{const pre=document.querySelector('pre');pre.textContent=t;pre.innerHTML=pre.innerHTML.replace(/Se puede usar, estudiar, modificar y compartir\s+SIN fines comerciales/,m=>'<mark style="background:#ffe066">'+m+'</mark>').replace(/Required Notice: [^\n]+/,m=>'<mark style="background:#ffe066">'+m+'</mark>');},text);
  await banner('https://pokesurvivor.com/LICENSE（网址原文）');
  await page.screenshot({path:'verification/appeal/1-official-license.png',clip:{x:0,y:0,width:1100,height:520}});
  // 2) GitHub repository: licence file and the "free, non-profit" description.
  await page.goto('https://github.com/JPTER78/pokesurvivor',{waitUntil:'load',timeout:60000});
  await banner('https://github.com/JPTER78/pokesurvivor');
  await page.screenshot({path:'verification/appeal/2-github-repo.png'});
  await page.goto('https://github.com/JPTER78/pokesurvivor/blob/main/LICENSE',{waitUntil:'load',timeout:60000});
  await banner('https://github.com/JPTER78/pokesurvivor/blob/main/LICENSE');
  await page.screenshot({path:'verification/appeal/3-github-license.png'});
  console.log('saved verification/appeal/*.png at',stamp);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
