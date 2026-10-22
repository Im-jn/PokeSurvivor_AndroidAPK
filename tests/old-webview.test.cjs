// Enhancements must parse on the oldest engine the official client supports
// (ES2018 / Chrome 64): many phones keep an old Android System WebView.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const acorn=require('../tools/esbuild/node_modules/acorn');
const root=path.resolve(__dirname,'..');
test('online/offline enhancement prefix and its compiled install function are ES2018',()=>{
  const prefix=fs.readFileSync(path.join(root,'source/online/bridge-prefix.js'),'utf8');
  acorn.parse(prefix,{ecmaVersion:2018});
  assert(!prefix.includes('new Function'),'official CSP forbids eval');
  assert.match(prefix,/Object\.hasOwn=/);assert.match(prefix,/'replaceAll'/);
});
test('packaged offline client and language loader parse on Chrome < 80 (ES2018)',()=>{
  for(const f of ['source/js/current-offline.js','source/js/core/locales.js','source/js/boot.js','source/js/ps-prefix.js'])
    acorn.parse(fs.readFileSync(path.join(root,f),'utf8'),{ecmaVersion:2018});
  const html=fs.readFileSync(path.join(root,'source/index.html'),'utf8');
  assert(html.indexOf('js/ps-prefix.js')>0&&html.indexOf('js/ps-prefix.js')<html.indexOf('js/current-offline.js'),'prefix loads separately, before the client');
});
test('online loader falls back to offline when the official client cannot parse',()=>{
  const loader=fs.readFileSync(path.join(root,'source/online/client-loader.js'),'utf8');
  assert.match(loader,/SyntaxError|Unexpected token/);assert.match(loader,/openOffline/);
});
test('APK serves the bundled official build only for the exact same version',()=>{
  const res=JSON.parse(fs.readFileSync(path.join(root,'source/online/local-resources.json'),'utf8'));
  const html=fs.readFileSync(path.join(root,'source/vendor/official/index.html'),'utf8');
  const app=html.match(/js\/app\.min\.js\?v=([\w-]+)/)[1];
  const versioned=Object.entries(res).filter(([,v])=>v.versioned);
  assert(versioned.some(([u])=>u==='https://pokesurvivor.com/js/app.min.js?v='+app),'bundled client matches the snapshot fingerprint');
  for(const [,v] of versioned)assert(fs.existsSync(path.join(root,'source',v.file)),v.file);
  const smali=fs.readFileSync(path.join(root,'android/smali/com/john/pokesurvivor/LocalWebAssets.smali'),'utf8');
  assert.match(smali,new RegExp('const-string v2, "'+app+'"'));assert.match(smali,/"__ps_original"/);
  const main=fs.readFileSync(path.join(root,'android/smali/com/john/pokesurvivor/MainActivity.smali'),'utf8');
  assert.match(main,/const-wide\/16 v3, 0x61a8/,'25 s launch deadline');
});
