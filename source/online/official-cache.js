// Official files kept by the APK across official updates (native OfficialCache).
// The APK ships the official build it was packed with; after an official update
// the new files used to come over a slow connection on every start (the startup
// deadline then switched to the offline version, again and again). Now each new
// official file is downloaded once, kept, and served locally from then on.
// Part of the enhancement prefix (plain ES2018, runs before the official client).
var psOfficial=(function(){
  // js/ps-index.js: the official page itself, kept as a script (latest-write.js).
  var ALLOWED=/^\/(js\/app\.min\.js|css\/style\.css|js\/core\/locales\.js|js\/lang\/[A-Za-z-]+\.js|js\/ps-index\.js)$/;
  // Memory patches (tools/official-patches.cjs), applied to the kept client.
  var PATCHES=__PS_PATCHES__;
  // Versions the APK ships (served without a download): {path: version}.
  var BUNDLED=__PS_BUNDLED__;
  // Size of the bundled client: a new official build is about as big (progress bar).
  var APP_SIZE=__PS_APP_SIZE__;
  // When the bundled official build was taken (ms): a kept build published
  // later is newer, and the local version may run it.
  var BUNDLED_AT=__PS_BUNDLED_AT__,POINTER='ps.officialLatest';
  function app(){var a=window.AndroidApp;return a&&a.hasOfficial&&a.storeOfficial?a:null;}
  function target(href){
    try{var u=new URL(href,'https://pokesurvivor.com/');}catch(_){return null;}
    if(u.hostname!=='pokesurvivor.com'||!ALLOWED.test(u.pathname)||!u.searchParams.get('v'))return null;
    // The plain app.min.js URL is answered with the enhancement loader.
    if(u.pathname==='/js/app.min.js')u.searchParams.set('__ps_original','1');
    return {url:u.href,path:u.pathname,v:u.searchParams.get('v')};
  }
  function has(path,v){if(BUNDLED[path]===v||(/^\/js\/lang\//.test(path)&&BUNDLED['/js/lang/']===v))return true;var a=app();try{return !!(a&&a.hasOfficial(path,v));}catch(_){return false;}}
  function patch(code){
    for(var i=0;i<PATCHES.length;i++){
      var re=new RegExp(PATCHES[i][0],'g'),found=code.match(re);
      if(found&&found.length===1)code=code.replace(new RegExp(PATCHES[i][0]),PATCHES[i][1]);
    }
    return code;
  }
  function download(url,onBytes,signal){
    return fetch(url,{cache:'no-cache',signal:signal}).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      if(!r.body||!r.body.getReader||!window.TextDecoder)return r.text();
      var reader=r.body.getReader(),decoder=new TextDecoder(),parts=[],bytes=0;
      function pump(){return reader.read().then(function(x){
        if(x.done){parts.push(decoder.decode());return parts.join('');}
        bytes+=x.value.length;parts.push(decoder.decode(x.value,{stream:true}));
        if(onBytes)try{onBytes(bytes);}catch(_){}
        return pump();
      });}
      return pump();
    });
  }
  // The official site is on GitHub Pages, often very slow from mainland China.
  // Its public repository (JPTER78/pokesurvivor, deployed from main) is also
  // served by jsDelivr's CDNs; a mirror is only used while its version.json
  // names the same official build as the page.
  var MIRRORS=['https://fastly.jsdelivr.net/gh/JPTER78/pokesurvivor@main','https://gcore.jsdelivr.net/gh/JPTER78/pokesurvivor@main','https://testingcf.jsdelivr.net/gh/JPTER78/pokesurvivor@main'];
  var mirrorChecks={};
  function mirrorOk(base,appV){
    var key=base+'@'+appV;
    if(!mirrorChecks[key])mirrorChecks[key]=new Promise(function(resolve){
      var timer=setTimeout(function(){resolve(false);},10000);
      fetch(base+'/version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;})
        .then(function(j){clearTimeout(timer);resolve(!!j&&j.v===appV);},function(){clearTimeout(timer);resolve(false);});
    });
    return mirrorChecks[key];
  }
  // Official site and mirrors at the same time; the first complete copy wins.
  function fetchFastest(t,appV,onBytes){
    return new Promise(function(resolve,reject){
      var left=1+MIRRORS.length,finished=false,best=0,controllers=[];
      function fail(){if(--left===0&&!finished)reject(new Error('no source'));}
      function start(url){
        var c=window.AbortController?new AbortController():null;controllers.push(c);
        download(url,function(n){if(n>best){best=n;if(onBytes)onBytes(n);}},c&&c.signal).then(function(text){
          if(finished)return;
          if(!text||text.length<(t.path==='/js/app.min.js'?100000:64))return fail();
          finished=true;
          controllers.forEach(function(x){if(x&&x!==c)try{x.abort();}catch(_){}});
          resolve(text);
        },fail);
      }
      start(t.url);
      MIRRORS.forEach(function(base){
        if(!appV||!window.Promise)return fail();
        mirrorOk(base,appV).then(function(ok){if(finished)return;if(ok)start(base+t.path);else fail();});
      });
    });
  }
  // Download one official file and keep it. Resolves true when kept.
  // appV: the official build (app.min.js ?v=) the file belongs to.
  function keep(href,onBytes,appV){
    var a=app(),t=target(href);
    if(!a||!t)return Promise.resolve(false);
    if(has(t.path,t.v))return Promise.resolve(true);
    if(t.path==='/js/app.min.js')appV=t.v;
    return fetchFastest(t,appV,onBytes).then(function(text){
      if(t.path==='/js/app.min.js')text=patch(text);
      try{return !!a.storeOfficial(t.path,t.v,text);}catch(_){return false;}
    });
  }
  function drop(href){var a=app(),t=target(href);if(a&&t&&a.dropOfficial)try{a.dropOfficial(t.path,t.v);}catch(_){}}
  // Files of an official page (its HTML), one after the other.
  function filesOf(html,base){
    var out=[],re=/(?:href|src)="([^"]*(?:css\/style\.css|js\/core\/locales\.js|js\/app\.min\.js)\?v=[\w-]+)"/g,m;
    while((m=re.exec(html)))out.push(new URL(m[1],base).href);
    // locales.js writes js/lang/<lang>.js?v=<same fingerprint>.
    var loc=html.match(/js\/core\/locales\.js\?v=([\w-]+)/),lang='zh-Hans';
    try{lang=localStorage.getItem('ps.lang')||lang;}catch(_){}
    if(loc&&/^[A-Za-z-]+$/.test(lang)&&lang!=='es')out.push(new URL('js/lang/'+lang+'.js?v='+loc[1],base).href);
    return out;
  }
  // "35% · 12 KB/s · 约剩 2 分钟" for the client download.
  function progressText(bytes,started){
    var secs=Math.max(1,(Date.now()-started)/1000),speed=bytes/secs,percent=Math.min(99,Math.round(bytes/APP_SIZE*100));
    var left=speed>0?Math.max(0,(APP_SIZE-bytes)/speed):0,rest=left>=90?'约剩 '+Math.ceil(left/60)+' 分钟':'约剩 '+Math.max(1,Math.round(left))+' 秒';
    return {percent:percent,text:percent+'% · '+Math.round(speed/1024)+' KB/s · '+rest};
  }
  function appVersionOf(list){for(var i=0;i<list.length;i++){var t=target(list[i]);if(t&&t.path==='/js/app.min.js')return t.v;}return '';}
  // onBytes: progress of the client download only (the other files are small).
  function keepAll(list,appV,onBytes){
    appV=appV||appVersionOf(list);
    return list.reduce(function(p,href){return p.then(function(){
      var t=target(href);
      return keep(href,t&&t.path==='/js/app.min.js'?onBytes:null,appV).catch(function(){return false;});
    });},Promise.resolve());
  }
  function missing(list){return list.filter(function(href){var t=target(href);return t&&!has(t.path,t.v);});}
  // The current official build: {v, at, html}. The official site's answer is
  // preferred; mirrors can lag behind, so of those the newest one is taken.
  function latestFrom(base,page){
    return fetch(base+'/version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
      if(!j||!j.v)throw new Error('no version');
      return fetch(base+page,{cache:'no-store'}).then(function(r){return r.ok?r.text():'';}).then(function(html){
        if(html.indexOf('app.min.js?v='+j.v)<0)throw new Error('page of another build');
        return {v:j.v,at:j.at||'',html:html};
      });
    });
  }
  function latest(){
    return new Promise(function(resolve){
      var found=[],left=1+MIRRORS.length,finished=false;
      function finish(){if(finished)return;finished=true;found.sort(function(a,b){return Date.parse(b.at)-Date.parse(a.at);});resolve(found[0]||null);}
      function settle(){if(--left===0)finish();}
      latestFrom('https://pokesurvivor.com','/?ps_prefetch='+Date.now()).then(function(L){found=[L];finish();},settle);
      MIRRORS.forEach(function(m){latestFrom(m,'/index.html').then(function(L){found.push(L);settle();},settle);});
      setTimeout(function(){if(found.length)finish();},20000);
    });
  }
  // Keep the page of a fully kept build and remember it for the local version.
  function keepPage(L){
    var a=app();if(!a)return false;
    try{if(!has('/js/ps-index.js',L.v)&&!a.storeOfficial('/js/ps-index.js',L.v,'window.__psOfficialHtml='+JSON.stringify(L.html)+';'))return false;}catch(_){return false;}
    try{localStorage.setItem(POINTER,JSON.stringify({v:L.v,at:L.at}));}catch(_){return false;}
    return true;
  }
  // The local version can run it: newer than the bundled build, and a WebView
  // new enough for the uncompiled official code (ES2020).
  function localCanUse(L){
    var chrome=+((navigator.userAgent.match(/Chrome\/(\d+)/)||[])[1]||0);
    return chrome>=85&&Date.parse(L.at)>BUNDLED_AT&&has('/js/app.min.js',L.v)&&has('/js/ps-index.js',L.v);
  }
  function bundledApp(){return BUNDLED['/js/app.min.js'];}
  return {app:app,target:target,has:has,keep:keep,drop:drop,filesOf:filesOf,keepAll:keepAll,missing:missing,progressText:progressText,patch:patch,latest:latest,keepPage:keepPage,localCanUse:localCanUse,bundledApp:bundledApp};
})();
window.__psOfficial=psOfficial;
// Local version (players without a VPN): download the current official build
// in the background. Once complete, the local version itself runs it (with the
// local save), so these players get new official content without a new APK;
// the online version also starts without waiting. A small bar shows progress;
// it can be closed (the download goes on).
if(location.protocol==='file:'&&psOfficial.app()&&window.fetch)setTimeout(function(){
  var base='https://pokesurvivor.com/',bar=null,closed=false,started=Date.now();
  function ui(html){
    if(closed)return;
    if(!bar){
      bar=document.createElement('div');bar.id='ps-official-bg';bar.setAttribute('translate','no');
      bar.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);transform:translateX(-50%);z-index:99997;background:rgba(21,37,75,.92);color:#fff;padding:6px 34px 6px 12px;border-radius:8px;font:12px sans-serif;max-width:92vw;box-sizing:border-box;pointer-events:auto';
      document.body.appendChild(bar);
    }
    bar.innerHTML=html+'<button type="button" aria-label="关闭" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:18px;line-height:1;padding:4px 6px">×</button>';
    bar.lastChild.onclick=function(){closed=true;bar.remove();};
  }
  psOfficial.latest().then(function(L){
    // Already running it, or the APK's own build is this one.
    if(!L||L.v===window.__psRunningOfficial||psOfficial.has('/js/app.min.js',L.v)&&psOfficial.bundledApp()===L.v)return;
    var list=psOfficial.missing(psOfficial.filesOf(L.html,base));
    if(list.length)ui('正在后台下载官网新版本… 连接中');
    return psOfficial.keepAll(list,L.v,function(n){
      var info=psOfficial.progressText(n,started);
      ui('正在后台下载官网新版本：'+info.text);
    }).then(function(){
      if(psOfficial.missing(list).length||!psOfficial.keepPage(L)){if(bar&&!closed)bar.remove();return;}
      if(!psOfficial.localCanUse(L))return;
      // Only offer it when the local version can run it (see latest-gate.js).
      closed=false;
      ui('官网新版本已下载好 <button type="button" class="ps-go" style="margin-left:6px">重启本地版，用上新版内容</button>');
      var go=bar&&bar.querySelector('.ps-go');
      if(go)go.onclick=function(){try{G.DB.commit(true);}catch(_){}setTimeout(function(){location.replace('latest.html?offline');},300);};
    });
  }).catch(function(){if(bar)bar.remove();});
},4000);
