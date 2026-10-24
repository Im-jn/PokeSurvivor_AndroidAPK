
// Runs the real official client after the enhancement prefix. WebView fetches
// it with its own network stack (VPN/proxy, cookies, TLS). After an official
// update the new client is downloaded once with visible progress and kept by
// the APK (official-cache.js); later starts load it from the phone.
;(function(){
  var src=document.currentScript&&document.currentScript.src;if(!src)return;
  var url=new URL(src);url.searchParams.set('__ps_original','1');
  var app=window.AndroidApp,official=window.__psOfficial,v=url.searchParams.get('v')||'';
  var kept=!!(official&&v&&official.has('/js/app.min.js',v));
  function offline(reason){window.__PSOnlineInstallError=reason;if(app&&app.openOffline)app.openOffline();}
  function run(){
    var script=document.createElement('script');script.src=url.href;script.async=false;
    script.onload=function(){window.__psOfficialPending=false;if(window.__psCheckCaptured)window.__psCheckCaptured();};
    script.onerror=function(){window.__psOfficialPending=false;offline('Official client download failed');};
    document.head.appendChild(script);
  }
  addEventListener('error',function(e){
    if(window.__PSOnlineInstalled||!e||!/SyntaxError|Unexpected token/i.test(String(e.message))||!/app\.min\.js/.test(String(e.filename)))return;
    // A kept copy that does not run is thrown away; the next start downloads it again.
    if(official)official.drop(url.href);
    offline('Official client needs a newer WebView');
  });
  // Afterwards keep this page's style sheet and language files too.
  function keepRest(){
    if(!official)return;
    var list=[];
    for(var el of document.querySelectorAll('link[rel=stylesheet][href],script[src]')){var h=el.href||el.src;if(official.target(h)&&!/app\.min\.js/.test(h))list.push(h);}
    official.keepAll(list);
  }
  addEventListener('load',function(){setTimeout(keepRest,8000);});
  if(kept||!official||!official.app()||!v||!window.fetch){run();return;}

  // Not kept yet: download it here, showing progress. Tell the APK that data is
  // still arriving, so its startup deadline does not switch to the offline
  // version halfway through the download.
  window.__psOfficialPending=true;
  var box=document.createElement('div');box.id='ps-official-download';box.setAttribute('translate','no');
  box.style.cssText='position:fixed;left:50%;bottom:12%;transform:translateX(-50%);z-index:99998;background:rgba(21,37,75,.92);color:#fff;padding:10px 14px;border-radius:10px;font:14px sans-serif;text-align:center;max-width:90vw';
  var line=document.createElement('div');line.textContent='官方游戏已更新，正在下载新版本（只需下载一次）…';
  var bytes=document.createElement('div');bytes.style.cssText='margin-top:4px;color:#ffd23f';
  box.appendChild(line);box.appendChild(bytes);
  if(app&&app.openOffline){var local=document.createElement('button');local.textContent='先玩本地离线版';local.style.cssText='margin-top:8px';local.onclick=function(){app.openOffline();};box.appendChild(local);}
  function show(){if(document.body&&!box.parentNode)document.body.appendChild(box);}
  show();if(!box.parentNode)addEventListener('DOMContentLoaded',show);
  var started=Date.now(),pinged=0;
  function progress(n){
    var now=Date.now();
    bytes.textContent=Math.round(n/1024)+' KB · '+Math.round(n/1024/Math.max(1,(now-started)/1000))+' KB/s';
    if(app&&app.startupProgress&&now-pinged>1000){pinged=now;try{app.startupProgress();}catch(_){}}
  }
  if(app&&app.startupProgress)try{app.startupProgress();}catch(_){}
  function done(){if(box.parentNode)box.parentNode.removeChild(box);run();}
  official.keep(url.href,progress).then(done,done);
})();
