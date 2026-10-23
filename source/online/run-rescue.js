// Keep a run's rewards when the app dies mid-run.
// Every few seconds during a run, store what the run has earned so far. A run
// that ends normally clears it (the game commits the save with 'run'). If the
// app was killed instead (Android low memory, WebView crash), the next start
// pays the same coins the game pays when a run is quit, using the game's own
// formula, and adds the run to the statistics. Tickets are already saved by
// the game the moment they are picked up.
(() => {
  const DB=G.DB,Game=G.Game;
  if(!DB||!Game||typeof DB.commit!=='function')return;
  const KEY='ps.runRescue',EVERY=8000,MAX_AGE=7*24*3600e3;
  const TEXT={
    zh:(c,t,k)=>`上一局意外中断，已按中断时的进度补发 ${c} 宝可金币（坚持 ${t}，击败 ${k}）。`,
    en:(c,t,k)=>`Your last run was interrupted: ${c} PokéCoins added for it (${t}, ${k} defeated).`,
    es:(c,t,k)=>`Tu última partida se interrumpió: se te dan ${c} Pokémonedas por ella (${t}, ${k} derrotados).`
  };
  const text=()=>{const l=String(G.I18n&&G.I18n.lang||'');return /^zh/.test(l)?TEXT.zh:l==='es'?TEXT.es:TEXT.en;};
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){return null;}};
  const clear=()=>{try{localStorage.removeItem(KEY);}catch(_){}};
  // Online guests have no save at all; offline guests do (on this device).
  const account=()=>{try{if(!DB.save||(DB.guest&&DB.mode==='cloud'))return null;return DB.mode+':'+(DB.user||'guest');}catch(_){return null;}};
  const inRun=()=>['playing','paused','held','levelup','ui-run'].includes(Game.state)||(Game.player&&Game.state!=='ui'&&Game.state!=='over');

  let lastPlayer=null,runId='';
  function checkpoint(){
    const p=Game.player,acct=account();
    if(!p||!acct||!inRun()||p.dead&&Game.state==='over')return;
    if(p!==lastPlayer){lastPlayer=p;runId=Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
    const time=Game.st&&+Game.st.time||0;
    if(time<30)return; // not worth a refund
    try{localStorage.setItem(KEY,JSON.stringify({acct,id:runId,dex:p.dex,time,kills:p.kills|0,bosses:p.bosses|0,coins:p.coins|0,coinMul:+p.coinMul||1,level:p.level|0,at:Date.now()}));}catch(_){}
  }
  setInterval(checkpoint,EVERY);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')checkpoint();});
  addEventListener('pagehide',checkpoint);

  // The game ends every run (death, quit, Arceus) with DB.commit('run').
  const commit=DB.commit;
  DB.commit=function(reason,...rest){if(reason==='run'){clear();lastPlayer=null;}return commit.call(this,reason,...rest);};

  function apply(){
    const r=read();if(!r)return true;
    if(Date.now()-r.at>MAX_AGE){clear();return true;}
    if(inRun())return false;
    const acct=account();if(!acct)return false;
    if(acct!==r.acct)return false; // another account: keep it for later
    const s=DB.save;if(!s)return false;
    const coins=Math.round((Math.floor(r.time/5)+Math.floor(0.25*r.kills)+80*r.bosses+r.coins)*r.coinMul);
    s.coins=(+s.coins||0)+coins;
    const st=s.stats=s.stats||{};
    st.runs=(+st.runs||0)+1;st.totalKills=(+st.totalKills||0)+r.kills;st.coinsEarned=(+st.coinsEarned||0)+coins;
    st.bestTime=Math.max(+st.bestTime||0,Math.floor(r.time));st.bestLevel=Math.max(+st.bestLevel||0,r.level);
    if(r.dex){s.pused=s.pused||{};s.pused[r.dex]=(+s.pused[r.dex]||0)+1;}
    clear();
    try{commit.call(DB,true);}catch(_){}
    try{G.UI.refreshCoins&&G.UI.refreshCoins();}catch(_){}
    const t=Math.floor(r.time/60)+':'+String(Math.floor(r.time%60)).padStart(2,'0');
    try{G.UI.toast(text()(coins,t,r.kills),9000);}catch(_){}
    return true;
  }
  // Once the save is loaded and we are in the menus.
  const timer=setInterval(()=>{if(apply())clearInterval(timer);},2000);
  G.RunRescue={checkpoint,apply,read,clear};
})();
