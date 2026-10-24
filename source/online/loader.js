
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
    official.keepAll(list,v);
  }
  addEventListener('load',function(){setTimeout(keepRest,8000);});
  if(kept||!official||!official.app()||!v||!window.fetch){run();return;}

  // Not kept yet: download it here, showing progress. Tell the APK that data is
  // still arriving, so its startup deadline does not switch to the offline
  // version halfway through the download.
  window.__psOfficialPending=true;
  // With a VPN this takes seconds and the game just starts. Without one the
  // official site can be very slow: the player may start the local version
  // instead, which keeps downloading in the background (official-cache.js).
  var box=document.createElement('div');box.id='ps-official-download';box.setAttribute('translate','no');
  box.style.cssText='position:fixed;left:50%;bottom:8%;transform:translateX(-50%);z-index:99998;background:rgba(21,37,75,.95);color:#fff;padding:12px 16px;border-radius:10px;font:14px sans-serif;text-align:center;width:min(420px,90vw);box-sizing:border-box';
  box.innerHTML='<div>官方游戏有新版本，需要下载一次</div><div class="ps-od-bar" style="margin:8px 0 4px;height:8px;border-radius:4px;background:rgba(255,255,255,.18);overflow:hidden"><i style="display:block;height:100%;width:0;background:#ffd23f"></i></div><div class="ps-od-num" style="color:#ffd23f;font-size:13px">连接中…</div><div style="margin-top:6px;font-size:12px;color:#c8d3f0">没开 VPN 时可能要几分钟。可以先玩本地版：新版会在后台继续下载，下好后本地版也能用上新版内容。</div>';
  if(app&&app.openOffline){var local=document.createElement('button');local.textContent='先玩本地版（后台下载）';local.style.cssText='margin-top:8px;padding:6px 12px';local.onclick=function(){app.openOffline();};box.appendChild(local);}
  var fill=box.querySelector('.ps-od-bar i'),num=box.querySelector('.ps-od-num');
  function show(){if(document.body&&!box.parentNode)document.body.appendChild(box);}
  show();if(!box.parentNode)addEventListener('DOMContentLoaded',show);
  var started=Date.now(),pinged=0;
  function progress(n){
    var now=Date.now(),info=official.progressText(n,started);
    fill.style.width=info.percent+'%';num.textContent=info.text;
    if(app&&app.startupProgress&&now-pinged>1000){pinged=now;try{app.startupProgress();}catch(_){}}
  }
  if(app&&app.startupProgress)try{app.startupProgress();}catch(_){}
  function done(){if(box.parentNode)box.parentNode.removeChild(box);run();}
  official.keep(url.href,progress).then(done,done);
})();
