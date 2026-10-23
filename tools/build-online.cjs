// Enhancements run after the real official client defines its game object.
// Authentication, Firebase configuration and save migration remain official.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dev=read('source/dev.html');
const map=dev.slice(dev.indexOf('<section id="scr-map"'),dev.indexOf('<!-- scripts:begin -->'));
const modules=['js/core/audio.js'].map(p=>`/* ${p} */
`+read('source/'+p));
modules.push(read('source/js/ui/map-ui.js'),read('source/online/game-adapter.js'),read('source/online/run-mode.js'),read('source/online/dex-layout.js'),read('source/online/dex-extras.js'),read('source/online/attack-button.js'),read('source/online/cloud-sync.js'),read('source/online/run-rescue.js'),read('source/js/core/mobile-layout.js'));
// Our own UI strings (map, pause button) for the official i18n: Spanish keys.
const labels=require('./map-labels.cjs');
const labelsZh=Object.fromEntries(Object.entries(labels).map(([k,v])=>[k,v[0]])),labelsEn=Object.fromEntries(Object.entries(labels).map(([k,v])=>[k,v[1]]));
const install=`function install(G,recover) {
  const officialDB=G.DB, officialConfig=G.FIREBASE_CONFIG, officialFlow=G.Flow, officialGame=G.Game, officialStart=G.Game.startRun;
  window.G=G;
  if(location.protocol==='file:'){
    ${read('source/js/core/db.js')}
    const login=G.Flow.toLogin;
    G.Flow.toLogin=function(){if(!G.DB.save)G.DB.playAsGuest();this.afterLogin();};
  }
  for(const [key,value] of Object.entries({minimap:true,mapPredict:true,mapTerrain:true,mapRange:96,mapFilters:['chest','bigchest','altar','spring']}))if(G.Settings.get(key)===undefined)G.Settings.set(key,value);
  const style=document.createElement('style');style.textContent=${JSON.stringify(read('source/css/map.css')+'\n'+read('source/css/mobile-layout.css')+'\n'+read('source/online/online.css'))};document.head.appendChild(style);
  ${read('source/online/css-compat.js')}
  psCssCompat.apply(style);
  window.__psCssCompat=psCssCompat.needed;
  const host=document.createElement('div');host.innerHTML=${JSON.stringify(map)};document.body.append(...host.childNodes);
  if(!document.querySelector('#set-tabs [data-t="map"]')){
    const button=document.createElement('button');button.className='gen-tab';button.dataset.t='map';button.textContent='Mapa';document.querySelector('#set-tabs').appendChild(button);
  }
  if(!document.getElementById('btn-pause-map')){
    const button=document.createElement('button');button.id='btn-pause-map';button.className='btn';button.textContent='Mapa · M';document.getElementById('btn-pause-settings').before(button);
  }
  ${modules.join('\n;\n')}
  ${read('source/js/game.js').slice(read('source/js/game.js').indexOf('G.ExitApp ='),read('source/js/game.js').indexOf('G.Flow ='))}
  // The official game is translated (incl. Simplified Chinese); only add our labels.
  G.I18n.add(${JSON.stringify(labelsEn)},'en');
  if(/^zh/.test(G.I18n.lang))G.I18n.add(${JSON.stringify(labelsZh)},G.I18n.lang);
  // Keep the current official screen and account lifecycle.
  G.Flow=officialFlow;
  const officialBoot=officialFlow.boot;
  let booted=false;
  officialFlow.boot=function(...args){if(booted)return;booted=true;try{G.MapUI.init();return officialBoot.apply(this,args);}catch(error){recover(error);}};
  const open=G.LoginUI.open;
  G.LoginUI.open=function(){
    open.call(this);document.getElementById('btn-google').classList.add('hidden');document.getElementById('btn-google').parentElement.classList.add('hidden');
    if(window.AndroidApp?.openOffline&&!document.getElementById('login-local-offline')){
      const button=document.createElement('button');button.id='login-local-offline';button.className='btn small ghost';button.textContent='本地离线存档';button.onclick=()=>window.AndroidApp.openOffline();document.getElementById('btn-guest').parentElement.appendChild(button);
    }
  };
  const openSettings=G.SettingsUI.open;
  G.SettingsUI.open=function(tab){if(tab==='map'){openSettings.call(this);renderMapSettings();}else openSettings.call(this,tab);addOfflineEntry();};
  function renderMapSettings(){
    document.querySelectorAll('#set-tabs .gen-tab').forEach(b=>b.classList.toggle('on',b.dataset.t==='map'));
    const box=document.getElementById('set-body');box.scrollTop=0;box.innerHTML=G.MapUI.settingsHTML();
    box.querySelectorAll('.switch[data-k]').forEach(b=>{b.onclick=()=>{G.Settings.set(b.dataset.k,!G.Settings.get(b.dataset.k));renderMapSettings();};});
  }
  // Capture phase: runs before the official per-tab handler, which does not know "map".
  document.getElementById('set-tabs').addEventListener('click',event=>{
    if(!event.target.closest('[data-t="map"]'))return;
    event.stopPropagation();renderMapSettings();
  },true);
  function addOfflineEntry(){
    const box=document.getElementById('set-body');
    if(document.querySelector('#set-tabs .gen-tab.on')?.dataset.t!=='acc')return;
    if(!box||document.getElementById('online-offline-mode'))return;
    // Offline: the official account panel talks about cloud accounts; replace it.
    if(location.protocol==='file:'){box.innerHTML='<h3 class="set-h">账号</h3>';const note=document.createElement('p');note.className='sub';note.textContent='当前为本地离线版，进度只保存在此设备；官网账号请返回在线版登录。两个模式的存档分别保存。';box.appendChild(note);}
    const button=document.createElement('button');button.id='online-offline-mode';button.className='btn small';
    if(location.protocol==='file:'){
      button.className='btn gold';button.textContent='返回官网在线版';
      button.onclick=()=>{try{G.DB.commit(true);}catch(_){}if(window.AndroidApp&&AndroidApp.openOnline)AndroidApp.openOnline();else location.href='https://pokesurvivor.com/';};
      box.appendChild(button);return;
    }
    button.textContent='打开本地离线存档';
    button.onclick=async()=>{G.DB.commit(true);try{if(G.DB.online)await Promise.race([G.DB.flush(),new Promise(r=>setTimeout(r,6000))]);}catch(_){}if(window.AndroidApp?.openOffline)window.AndroidApp.openOffline();else G.UI.toast('请在 APK 内打开离线存档。');};
    box.appendChild(button);
  }
  // Old system WebView: the official online client cannot run there, so the
  // loader sent the player here. Say why, once per launch.
  if(location.protocol==='file:'){
    const chrome=+((navigator.userAgent.match(/Chrome[/](\\d+)/)||[])[1]||0);
    if(chrome&&chrome<80)setTimeout(()=>{try{G.UI.toast('系统 WebView 版本较旧（Chrome '+chrome+'），官网在线版需要 Chrome 80 以上，已进入离线版。在应用商店更新“Android System WebView”后即可使用在线版和账号。',10000);}catch(_){}},3000);
  }
  // Offline: keep a visible way back to the online site in the top bar.
  if(location.protocol==='file:'&&window.AndroidApp&&AndroidApp.openOnline&&!document.getElementById('ps-go-online')){
    const bar=document.getElementById('topbar');
    if(bar){const b=document.createElement('button');b.id='ps-go-online';b.className='btn small gold';b.setAttribute('translate','no');b.textContent='返回在线版';b.onclick=()=>{try{G.DB.commit(true);}catch(_){}AndroidApp.openOnline();};bar.prepend(b);}
  }
  const observer=new MutationObserver(()=>{if(document.querySelector('#scr-settings:not(.hidden)')){addOfflineEntry();}});observer.observe(document.getElementById('set-body'),{childList:true});
  window.__PSOnlineInstalled={version:'1.5.0',origin:location.origin,officialDBUnchanged:G.DB===officialDB,officialConfigUnchanged:G.FIREBASE_CONFIG===officialConfig,officialFlowUnchanged:G.Flow===officialFlow,officialGameUnchanged:G.Game===officialGame&&G.Game.startRun===officialStart,judgment:!!G.Judgment};
}
`;
// Prototype interception is temporary and is removed as soon as the official
// game object is constructed. No auth request, password or header is intercepted.
const esbuild=require('./esbuild/node_modules/esbuild');
// Many phones (no Google Play) keep an old Android System WebView. The official
// client runs on Chrome 64+, so compile our code to the same level.
const TARGET='chrome64';
const installCompiled=esbuild.transformSync('('+install+')',{target:TARGET,loader:'js'}).code.trim().replace(/;$/,'');
const prefix=`;(function(){'use strict';
if((location.protocol!=='file:'&&(location.protocol!=='https:'||location.hostname!=='pokesurvivor.com'))||window.__PSOnlinePrefix)return;
window.__PSOnlinePrefix=true;
function recover(error){
  window.__PSOnlineInstallError=String(error);
  try{sessionStorage.setItem('ps.online.error',String(error).slice(0,300));}catch(storageError){}
  function show(){if(document.getElementById('ps-enhancement-error'))return;var box=document.createElement('div');box.id='ps-enhancement-error';box.style.cssText='position:fixed;bottom:8px;left:8px;right:8px;z-index:99999;background:#15254b;color:white;padding:10px;font:14px sans-serif';box.textContent='小地图等增强功能加载失败，请重试。 ';var retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=function(){location.reload();};box.appendChild(retry);if(window.AndroidApp&&location.protocol==='file:'&&AndroidApp.openOnline){var online=document.createElement('button');online.textContent='返回在线版';online.onclick=function(){AndroidApp.openOnline();};box.appendChild(online);}else if(window.AndroidApp&&AndroidApp.openOffline){var local=document.createElement('button');local.textContent='本地版本';local.onclick=function(){AndroidApp.openOffline();};box.appendChild(local);}document.body.appendChild(box);}
  if(document.body)show();else addEventListener('DOMContentLoaded',show);
}
if(!Object.hasOwn)Object.hasOwn=function(o,k){return Object.prototype.hasOwnProperty.call(o,k);};
if(!String.prototype.replaceAll)Object.defineProperty(String.prototype,'replaceAll',{configurable:true,writable:true,value:function(a,b){if(a instanceof RegExp)return this.replace(a,b);return this.split(a).join(typeof b==='function'?b(a):b);}});
if(!Array.prototype.flat)Object.defineProperty(Array.prototype,'flat',{configurable:true,writable:true,value:function(d){d=d===undefined?1:Math.floor(d);return d<1?Array.prototype.slice.call(this):Array.prototype.reduce.call(this,function(a,v){return a.concat(Array.isArray(v)?v.flat(d-1):v);},[]);}});
if(!Array.prototype.flatMap)Object.defineProperty(Array.prototype,'flatMap',{configurable:true,writable:true,value:function(f,t){return Array.prototype.map.call(this,f,t).flat();}});
if(!Object.fromEntries)Object.fromEntries=function(it){var o={};Array.from(it,function(e){o[e[0]]=e[1];});return o;};
if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{configurable:true,writable:true,value:function(i){i=Math.trunc(i)||0;if(i<0)i+=this.length;return this[i];}});
try{sessionStorage.removeItem('ps.online.disable-enhancements');}catch(storageError){}
// Hit-flash silhouettes for the patched official client (tools/official-patches.cjs):
// each is as big as a whole sprite sheet, so keep only those used recently.
window.__psWhiteCache=function(){
  var m=new Map(),swept=0,MAX=40,IDLE=6000;
  return {
    get:function(k){var now=Date.now(),e;if(now-swept>2000){swept=now;m.forEach(function(v,key){if(now-v.t>IDLE)m.delete(key);});}e=m.get(k);if(!e)return undefined;if(now-e.t>500){m.delete(k);m.set(k,e);}e.t=now;return e.c;},
    set:function(k,c){m.set(k,{c:c,t:Date.now()});if(m.size>MAX)m.delete(m.keys().next().value);return this;},
    get size(){return m.size;}
  };
};
// Sprite sheet cache of the patched client: entries {at, img}. Over 120 sheets,
// free those unused for 30 s (oldest first, down to 80) the way the client does
// when a sheet loads; sheets on screen are touched every frame and stay.
window.__psSheetCache=function(){
  var m=new Map();
  setInterval(function(){
    if(m.size<=120)return;
    var now=Date.now(),old=[];
    m.forEach(function(e,k){if(e&&e.img&&typeof e.at==='number'&&now-e.at>30000)old.push([k,e]);});
    old.sort(function(a,b){return a[1].at-b[1].at;});
    old.slice(0,m.size-80).forEach(function(p){m.delete(p[0]);p[1].img.onload=p[1].img.onerror=null;p[1].img.src='';});
  },5000);
  return m;
};
// Offline: never leave the player on an endless loading screen.
if(location.protocol==='file:')setTimeout(function(){
  var boot=document.getElementById('boot'),tap=document.getElementById('tap-start');
  if(window.__PSOnlineInstalled||(boot&&boot.classList.contains('hidden'))||(tap&&!tap.classList.contains('hidden')))return;
  var v=(navigator.userAgent.match(/Chrome\\/(\\d+)/)||[])[1]||'?';
  recover('游戏没能启动（系统 WebView 版本 Chrome '+v+'）。请在应用商店更新“Android System WebView”或“系统 WebView”后重试。');
},25000);
// Default language: the official Simplified Chinese. locales.js has already
// picked a language from the phone settings before this script runs, so reload
// once when it differs; a language chosen later in Settings is kept.
try{if(!localStorage.getItem('ps.lang')){localStorage.setItem('ps.lang','zh-Hans');if(window.PS_LOCALES&&PS_LOCALES.lang!=='zh-Hans'){location.reload();return;}}}catch(_){}
// Co-op uses WebRTC with Google STUN only, which is unreachable from mainland
// China: add STUN servers that answer there (and Cloudflare's) as well.
try{if(window.RTCPeerConnection&&!window.RTCPeerConnection.__psWrapped){
  var NativePC=window.RTCPeerConnection,EXTRA_STUN=['stun:stun.miwifi.com:3478','stun:stun.hitv.com:3478','stun:stun.cloudflare.com:3478'];
  var WrappedPC=function(config,constraints){
    var c={},k;config=config||{};for(k in config)c[k]=config[k];
    c.iceServers=(config.iceServers||[]).concat([{urls:EXTRA_STUN}]);
    return constraints===undefined?new NativePC(c):new NativePC(c,constraints);
  };
  WrappedPC.prototype=NativePC.prototype;Object.setPrototypeOf(WrappedPC,NativePC);WrappedPC.__psWrapped=true;
  window.RTCPeerConnection=WrappedPC;
}}catch(_){}
// Stale page after an official update: the HTML is cached for 10 minutes (by
// the CDN and by WebView) while version.json is always fresh, so the official
// updater keeps announcing a new version and reloading into the same old page.
// Load the page once under a fresh URL so it comes from the server instead.
(function(){
  if(location.protocol!=='https:')return;
  var me=document.currentScript&&document.currentScript.src||'',mine=(me.match(/[?&]v=([0-9a-f]+)/)||[])[1];
  if(!mine||!window.fetch)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    if(!j||!j.v||j.v===mine)return;
    var key='ps.fresh.'+j.v;
    try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch(_){return;}
    location.replace(location.origin+location.pathname+'?fresh='+encodeURIComponent(j.v)+location.hash);
  }).catch(function(){});
})();
if(navigator.serviceWorker){
  try{navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});navigator.serviceWorker.register=function(){return Promise.resolve(null);};}catch(_){}
}
var install;
// No eval: the official site now sends a CSP without 'unsafe-eval'. The
// compiled code is checked as ES2018 by tests/old-webview.test.cjs.
install=${installCompiled};
var prior=Object.getOwnPropertyDescriptor(Object.prototype,'Game');
var captured=false;
var setter=function(value){
  Object.defineProperty(this,'Game',{value,writable:true,enumerable:true,configurable:true});
  if(this.World&&this.DB&&this.Touch&&value&&typeof value.startRun==='function'){
    captured=true;
    if(prior)Object.defineProperty(Object.prototype,'Game',prior);else delete Object.prototype.Game;
    var root=this;
    Promise.resolve().then(function(){try{install(root,recover);}catch(error){recover(error);}});
  }
};
if(!prior)Object.defineProperty(Object.prototype,'Game',{configurable:true,set:setter});
setTimeout(function(){var d=Object.getOwnPropertyDescriptor(Object.prototype,'Game');if(d&&d.set===setter)delete Object.prototype.Game;if(!captured&&!window.__PSOnlineInstalled)recover('Official game object was not captured');},20000);
})();\n`;
new vm.Script(prefix);
fs.mkdirSync(path.join(root,'source/online'),{recursive:true});
fs.writeFileSync(path.join(root,'source/online/bridge-prefix.js'),prefix);
// Let WebView download the real script with its own VPN/proxy, cookies and TLS.
// The previous Java URLConnection used a separate network stack.
const loader=`\n;(function(){var src=document.currentScript&&document.currentScript.src;if(!src)return;var url=new URL(src);url.searchParams.set('__ps_original','1');var script=document.createElement('script');script.src=url.href;script.async=false;script.onerror=function(){window.__PSOnlineInstallError='Official client download failed';if(window.AndroidApp&&AndroidApp.openOffline)AndroidApp.openOffline();};addEventListener('error',function(e){if(window.__PSOnlineInstalled||!e||!/SyntaxError|Unexpected token/i.test(String(e.message))||!/app\\.min\\.js/.test(String(e.filename)))return;window.__PSOnlineInstallError='Official client needs a newer WebView';if(window.AndroidApp&&AndroidApp.openOffline)AndroidApp.openOffline();});document.head.appendChild(script);})();\n`;
fs.writeFileSync(path.join(root,'source/online/client-loader.js'),prefix+loader);
console.log('Online enhancement prefix: '+Buffer.byteLength(prefix)+' bytes; official auth/DB untouched');
