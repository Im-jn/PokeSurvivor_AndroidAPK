// Served by the APK instead of the official /sw.js. Android WebView sends
// service-worker fetches past the page interceptor, so an installed worker
// would load the unmodified client without Chinese text or the map.
// This worker removes itself and the official code/art caches (saves are in
// localStorage and Firebase, not here).
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>/^ps-(code|art)-/.test(key)).map(key=>caches.delete(key))))
    .catch(()=>{}).then(()=>self.registration.unregister())
));
