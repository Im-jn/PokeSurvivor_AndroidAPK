// Official files kept by the APK across official updates (native OfficialCache).
// The APK ships the official build it was packed with; after an official update
// the new files used to come over a slow connection on every start (the startup
// deadline then switched to the offline version, again and again). Now each new
// official file is downloaded once, kept, and served locally from then on.
// Part of the enhancement prefix (plain ES2018, runs before the official client).
var psOfficial=(function(){
  var ALLOWED=/^\/(js\/app\.min\.js|css\/style\.css|js\/core\/locales\.js|js\/lang\/[A-Za-z-]+\.js)$/;
  // Memory patches (tools/official-patches.cjs), applied to the kept client.
  var PATCHES=__PS_PATCHES__;
  // Versions the APK ships (served without a download): {path: version}.
  var BUNDLED=__PS_BUNDLED__;
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
  function download(url,onBytes){
    return fetch(url,{cache:'no-cache'}).then(function(r){
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
  // Download one official file and keep it. Resolves true when kept.
  function keep(href,onBytes){
    var a=app(),t=target(href);
    if(!a||!t)return Promise.resolve(false);
    if(has(t.path,t.v))return Promise.resolve(true);
    return download(t.url,onBytes).then(function(text){
      if(!text||text.length<64)return false;
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
  function keepAll(list){
    return list.reduce(function(p,href){return p.then(function(){return keep(href).catch(function(){});});},Promise.resolve());
  }
  return {app:app,target:target,has:has,keep:keep,drop:drop,filesOf:filesOf,keepAll:keepAll,patch:patch};
})();
window.__psOfficial=psOfficial;
// Offline version (shown when the official site was too slow): fetch the
// current official files in the background, so the next online start finds
// them in the APK instead of downloading them again.
if(location.protocol==='file:'&&psOfficial.app()&&window.fetch)setTimeout(function(){
  var base='https://pokesurvivor.com/';
  fetch(base+'?ps_prefetch='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.text():'';}).then(function(html){
    if(html)return psOfficial.keepAll(psOfficial.filesOf(html,base));
  }).catch(function(){});
},15000);
