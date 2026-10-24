// Write the kept official page into latest.html, the way build-current-offline
// prepares the bundled one: no <base>, the enhancements before the client, and
// the client, style and language files from the kept copies (relative URLs with
// ?v=, answered by the APK). Pictures and sounds come from the APK.
(function(){
  var p=window.__psLatest,html=window.__psOfficialHtml;
  function bundled(){try{localStorage.removeItem('ps.officialLatest');}catch(e){}location.replace('index.html?offline&ps_bundled=1');}
  if(!p||typeof html!=='string'||html.indexOf('app.min.js?v='+p.v)<0){bundled();return;}
  html=html.replace(/<base[^>]*>/g,'').replace(/<script>\s*window\.PS_PAGES\s*=\s*true;?\s*<\/script>/,'').replace(/<link[^>]*rel="preconnect"[^>]*>/g,'');
  // Kept copies live under ps-kept/ (files that exist in the APK, like the
  // older js/core/locales.js, are loaded without asking the APK).
  html=html.replace(/<script\b[^>]*\bsrc="js\/app\.min\.js\?v=([\w-]+)"[^>]*><\/script>/,function(m,v){
    return '<script defer src="js/ps-prefix.js"><\/script><script defer src="ps-kept/js/app.min.js?v='+v+'&__ps_original=1"><\/script>';
  });
  html=html.replace(/href="css\/style\.css\?v=/,'href="ps-kept/css/style.css?v=');
  // locales.js writes the bundled js/lang/<lang>.js; the kept one, loaded right
  // after it, replaces that dictionary with the current one.
  html=html.replace(/<script\b[^>]*\bsrc="js\/core\/locales\.js\?v=([\w-]+)"[^>]*><\/script>/,function(m,v){
    var lang='zh-Hans';try{lang=localStorage.getItem('ps.lang')||lang;}catch(e){}
    var out='<script src="ps-kept/js/core/locales.js?v='+v+'"><\/script>';
    if(/^[A-Za-z-]+$/.test(lang)&&lang!=='es')out+='<script src="ps-kept/js/lang/'+lang+'.js?v='+v+'"><\/script>';
    return out;
  });
  window.__psRunningOfficial=p.v;
  // The kept build does not run here: back to the bundled one.
  addEventListener('error',function(e){
    if(window.__PSOnlineInstalled||!e||!/SyntaxError|Unexpected token/i.test(String(e.message))||!/app\.min\.js/.test(String(e.filename)))return;
    bundled();
  });
  setTimeout(function(){
    var b=document.getElementById('boot'),t=document.getElementById('tap-start');
    if((b&&b.classList.contains('hidden'))||(t&&!t.classList.contains('hidden')))return;
    bundled();
  },30000);
  document.write(html);
})();
