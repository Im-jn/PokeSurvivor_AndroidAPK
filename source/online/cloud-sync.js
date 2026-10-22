// Cloud save in the APK. The official game uploads a change only 30 minutes
// later, or when the page closes ("pagehide", which Android does not send when
// an app goes to the background or is swiped away), and downloads the cloud
// save only at start-up. Phone and PC therefore looked out of sync.
//  - Leaving the screen: upload pending changes now (same as the Save button).
//  - Coming back after a while, in the menus: DB.flush() reads the cloud save,
//    merges it with this device's and writes the result, so progress made on
//    another device shows up. Not during a run, like the official download.
// Throttled to keep Firestore reads/writes low.
(() => {
  const DB=G.DB;
  if(!DB||typeof DB.saveNow!=='function'||typeof DB.flush!=='function')return;
  const MIN_AWAY=60e3,MIN_GAP=180e3;
  let hiddenAt=0,lastPull=0,lastPush=0;
  const online=()=>{try{return !!DB.online;}catch(_){return false;}};
  const run=fn=>{try{Promise.resolve(fn()).catch(()=>{});}catch(_){}};
  function push(){
    if(!online()||!/^(pending|offline)$/.test(DB.syncState))return;
    const now=Date.now();if(now-lastPush<5000)return;lastPush=now;
    run(()=>DB.saveNow());
  }
  function leave(){if(!hiddenAt)hiddenAt=Date.now();push();}
  function back(){
    const away=hiddenAt?Date.now()-hiddenAt:0;hiddenAt=0;
    if(!online()||away<MIN_AWAY||Date.now()-lastPull<MIN_GAP)return;
    if(G.Game&&G.Game.state&&G.Game.state!=='ui')return;
    lastPull=Date.now();run(()=>DB.flush());
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')leave();else back();});
  addEventListener('pagehide',leave);
  // The native shell reports onPause/onResume through the audio module.
  const audio=G.Audio,setActive=audio&&audio.setAppActive;
  if(typeof setActive==='function')audio.setAppActive=function(active){if(active===false)leave();else if(active===true)back();return setActive.apply(this,arguments);};
  G.CloudSync={leave,back};
})();
