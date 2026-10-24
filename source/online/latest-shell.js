// latest.html: load the kept official page (ps-kept/js/ps-index.js, served
// from the phone by the APK), then write it (latest-write.js).
(function(){
  var p=null;try{p=JSON.parse(localStorage.getItem('ps.officialLatest')||'null');}catch(e){}
  if(!p||!p.v){location.replace('index.html?offline&ps_bundled=1');return;}
  window.__psLatest=p;
  document.write('<script src="ps-kept/js/ps-index.js?v='+encodeURIComponent(p.v)+'"><\/script><script src="js/ps-latest-write.js"><\/script>');
})();
