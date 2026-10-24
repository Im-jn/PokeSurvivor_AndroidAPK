// Local version: run the newest official build kept on the phone (downloaded in
// the background, official-cache.js) instead of the one bundled in the APK.
// First script of index.html?offline; ?ps_bundled=1 forces the bundled build.
(function(){
  if(location.protocol!=='file:'||/[?&]ps_bundled=1/.test(location.search))return;
  var p=null;try{p=JSON.parse(localStorage.getItem('ps.officialLatest')||'null');}catch(e){return;}
  if(!p||!p.v||!(Date.parse(p.at)>__PS_BUNDLED_AT__))return;
  // The official code is not compiled for old WebViews (needs ES2020).
  var chrome=+((navigator.userAgent.match(/Chrome\/(\d+)/)||[])[1]||0);if(chrome<85)return;
  var a=window.AndroidApp;
  try{if(!a||!a.hasOfficial||!a.hasOfficial('/js/app.min.js',p.v)||!a.hasOfficial('/js/ps-index.js',p.v))return;}catch(e){return;}
  location.replace('latest.html'+location.search);
})();
