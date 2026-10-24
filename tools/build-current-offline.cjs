// Pin the offline client to a verified official snapshot, preserving save storage.
const fs=require('node:fs'),crypto=require('node:crypto');
const prefix=fs.readFileSync('source/online/bridge-prefix.js','utf8');
// Memory patches (tools/official-patches.cjs). The patched client, in its
// original form, is also what the APK serves online for the same official build.
const patched=require('./official-patches.cjs').patchOfficial(fs.readFileSync('source/vendor/official/app.min.js','utf8'));
if(patched.skipped.length)console.warn('Official memory patches skipped (code changed): '+patched.skipped.join(', '));
const client=patched.code;
fs.writeFileSync('source/js/official-app.js',client);
const vm=require('node:vm');new vm.Script(client);
// The official client now needs ES2020 (?? and ?.): on an older Android System
// WebView (Chrome < 80, common on vivo/OPPO/Xiaomi without Google Play) it does
// not parse and the game stays on the loading screen. Lower it to the level the
// enhancements use; tests/old-webview.test.cjs checks the result.
const esbuild=require('./esbuild/node_modules/esbuild');
// minifyWhitespace: the obfuscated client checks its own formatting
// (self-defending code) and hangs if it gets pretty-printed.
const compat=code=>esbuild.transformSync(code,{target:'chrome64',loader:'js',minifyWhitespace:true}).code;
const clientCompat=compat(client);new vm.Script(clientCompat);
const hash=crypto.createHash('sha256').update(client).digest('hex');
let html=fs.readFileSync('source/vendor/official/index.html','utf8');
html=html.replace(/<base[^>]+>/g,'').replace('<script>window.PS_PAGES = true;</script>','');
html=html.replace(/<link[^>]*rel="preconnect"[^>]*>/g,'');
// The official link carries ?v=…; the local css/style.css is the old client's.
html=html.replace(/href="css\/style\.css(?:\?[^"]*)?"/,'href="css/current-official.css"');
// Enhancements in their own file: if the client ever fails to parse, the
// prefix still runs and shows a recovery message instead of endless loading.
const prefixHash=crypto.createHash('sha256').update(prefix).digest('hex').slice(0,12);
html=html.replace(/<script defer src="js\/app.min.js[^>]+><\/script>/,'<script defer src="js/ps-prefix.js?v='+prefixHash+'"></script><script defer src="js/current-offline.js?v='+hash.slice(0,12)+'"></script>');
// Language loader and packs (locales.js document.writes js/lang/<lang>.js).
const copyTree=(from,to)=>{if(!fs.existsSync(from))return;for(const e of fs.readdirSync(from,{withFileTypes:true})){const a=from+'/'+e.name,b=to+'/'+e.name;if(e.isDirectory()){fs.mkdirSync(b,{recursive:true});copyTree(a,b);}else fs.copyFileSync(a,b);}};
fs.mkdirSync('source/js/lang',{recursive:true});copyTree('source/vendor/official/js/lang','source/js/lang');
for(const f of ['js/core/locales.js','js/noframe.js','js/boot.js'])if(fs.existsSync('source/vendor/official/'+f))fs.writeFileSync('source/'+f,compat(fs.readFileSync('source/vendor/official/'+f,'utf8')));
fs.writeFileSync('source/css/current-official.css',fs.readFileSync('source/vendor/official/style.css'));
fs.writeFileSync('source/js/ps-prefix.js',prefix);
fs.writeFileSync('source/js/current-offline.js',clientCompat);
// Newer official build kept on the phone (official-cache.js): the local
// version runs it through latest.html. The gate is the first script.
const bundledAt=Date.parse(JSON.parse(fs.readFileSync('source/vendor/official/provenance.json','utf8')).at)||0;
fs.writeFileSync('source/js/ps-latest-gate.js',compat(fs.readFileSync('source/online/latest-gate.js','utf8').replace('__PS_BUNDLED_AT__',String(bundledAt))));
fs.writeFileSync('source/js/ps-latest.js',compat(fs.readFileSync('source/online/latest-shell.js','utf8')));
fs.writeFileSync('source/js/ps-latest-write.js',compat(fs.readFileSync('source/online/latest-write.js','utf8')));
fs.writeFileSync('source/latest.html','<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><script src="js/ps-latest.js"></script></head></html>\n');
const gate='<script src="js/ps-latest-gate.js?v='+bundledAt+'"></script>';
html=/<meta http-equiv="Content-Security-Policy"[^>]*>/.test(html)?html.replace(/(<meta http-equiv="Content-Security-Policy"[^>]*>)/,'$1'+gate):html.replace(/(<meta charset[^>]*>)/i,'$1'+gate);
if(!html.includes(gate))throw Error('latest gate not inserted');
fs.writeFileSync('source/index.html',html);
console.log('Current offline client with Judgment: '+hash+' (memory patches: '+(patched.applied.join(', ')||'none')+')');
