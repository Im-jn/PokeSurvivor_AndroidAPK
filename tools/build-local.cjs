const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../source');
const dev=fs.readFileSync(path.join(root,'dev.html'),'utf8');
const begin='<!-- scripts:begin -->',end='<!-- scripts:end -->';
const i=dev.indexOf(begin),j=dev.indexOf(end);
const files=[...dev.slice(i,j).matchAll(/<script[^>]*src="(js\/[^"]+\.js)"/g)].map(m=>m[1]);
const labels=require('./map-labels.cjs');
fs.writeFileSync(path.join(root,'js/data/map-labels-zh.js'),'Object.assign(G.ZhData.phrases,'+JSON.stringify(Object.fromEntries(Object.entries(labels).map(([k,v])=>[k,v[0]])))+');\n');
fs.writeFileSync(path.join(root,'js/data/map-labels-en.js'),"if(G.I18n.lang==='en')G.I18n.add("+JSON.stringify(Object.fromEntries(Object.entries(labels).map(([k,v])=>[k,v[1]])))+');\n');
let parts=[];
for(const file of files){
  let text=fs.readFileSync(path.join(root,file),'utf8');
  new vm.Script(text,{filename:file});
  parts.push(`/* ${file} */\n${text}`);
}
const joined=parts.join('\n;\n');new vm.Script(joined);
const hash=crypto.createHash('sha256').update(joined).digest('hex').slice(0,12);
fs.writeFileSync(path.join(root,'js/app.min.js'),joined);
const html=dev.slice(0,i)+`<script defer src="js/app.min.js?v=${hash}"></script>`+dev.slice(j+end.length);
fs.writeFileSync(path.join(root,'index.html'),html);
// The shell loads index.html; keep the English auxiliary entry on the same bundle too.
let en=fs.readFileSync(path.join(root,'en/index.html'),'utf8');
en=en.replace(/app\.min\.js\?v=[a-z0-9]+/g,'app.min.js?v='+hash);
if(!en.includes('css/map.css'))en=en.replace(/(<link[^>]*href="[^"]*css\/style\.css"[^>]*>)/,'$1\n<link rel="stylesheet" href="../css/map.css">');
if(!en.includes('css/mobile-layout.css'))en=en.replace(/(<link[^>]*href="[^"]*css\/map\.css"[^>]*>)/,'$1\n<link rel="stylesheet" href="css/mobile-layout.css">');
// Include the new map markup for this optional entry, using the source version.
if(!en.includes('id="scr-map"')){
  const map=dev.slice(dev.indexOf('<section id="scr-map"'),i);
  en=en.replace(/<script defer src="[^"]*app\.min\.js/,map+'\n<script defer src="../js/app.min.js');
  en=en.replace('<button class="gen-tab" data-t="ctl">','<button class="gen-tab" data-t="map">Mapa</button><button class="gen-tab" data-t="ctl">');
  en=en.replace('<button id="btn-pause-settings"','<button id="btn-pause-map" class="btn">Mapa · M</button><button id="btn-pause-settings"');
}
// en/index.html already has <base href="../">, so paths resolve from www/.
en=en.replace('href="../css/map.css"','href="css/map.css"').replace('src="../js/app.min.js','src="js/app.min.js');
fs.writeFileSync(path.join(root,'en/index.html'),en);
fs.writeFileSync(path.join(root,'version.json'),JSON.stringify({v:hash,at:new Date().toISOString(),variant:'ChineseWideMap APK'})+'\n');
console.log(`Built ${files.length} modules, ${(Buffer.byteLength(joined)/1024).toFixed(0)} KiB, SHA256 ${hash}`);
