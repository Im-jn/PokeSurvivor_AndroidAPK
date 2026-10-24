// Move info wherever a move icon is shown (Pokédex, Kecleon shop, Upgrades,
// level-up cards, pickers): tap the icon for name, type, physical/special,
// damage, cooldown and description. In a Pokémon's Pokédex page, a move taught
// with a TM can also be forgotten (the TM is not given back).
// Only public client APIs are used: G.Icons.html marks move icons, the save's
// ptm lists (what G.Mons.taught reads) are edited, then G.DB.commit().
(() => {
  if(!G.Moves||!G.Moves.BY_ID)return;
  const DB=G.DB,detail=document.getElementById('dex-detail'),dexScreen=document.getElementById('scr-dex');
  const TEXT={
    zh:{power:'伤害',cd:'冷却',sec:'秒',taught:'学习机已学会',forget:'遗忘这个招式',confirm:'再点一次确认遗忘（学习机不会返还）',forgot:x=>'已遗忘 '+x,inRun:'对局中不能遗忘招式'},
    en:{power:'Damage',cd:'Cooldown',sec:'s',taught:'Learned with a TM',forget:'Forget this move',confirm:'Tap again to forget it (the TM is not refunded)',forgot:x=>x+' forgotten',inRun:'Moves cannot be forgotten during a run'},
    es:{power:'Daño',cd:'Recarga',sec:'s',taught:'Aprendido con una MT',forget:'Olvidar este movimiento',confirm:'Toca otra vez para olvidarlo (la MT no se devuelve)',forgot:x=>x+' olvidado',inRun:'No se pueden olvidar movimientos durante una partida'}
  };
  const text=()=>{const l=String(G.I18n&&G.I18n.lang||'');return /^zh/.test(l)?TEXT.zh:l==='es'?TEXT.es:TEXT.en;};
  const T=(s,ns)=>{try{return G.T(s,ns);}catch(_){return s;}};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------- mark move icons ----------
  // G.Icons.html('move:<id>', size) returns one element (<img> today); give it
  // data-ps-move="<id>". Whatever the markup becomes, only its first tag changes.
  const Icons=G.Icons;
  if(Icons&&typeof Icons.html==='function'&&!Icons.html.__psMove){
    const html=Icons.html;
    const marked=function(key){
      const out=html.apply(this,arguments);
      if(typeof key!=='string'||key.slice(0,5)!=='move:'||typeof out!=='string')return out;
      return out.replace(/^(\s*<[a-zA-Z][\w-]*)/,'$1 data-ps-move="'+esc(key.slice(5))+'"');
    };
    marked.__psMove=true;Icons.html=marked;
  }

  // Fallback for the Pokédex rows (<span title="name">icon</span>) if icons were
  // ever rendered without the mark.
  let byName=null,byNameLang='';
  function moveByName(name){
    const lang=G.I18n&&G.I18n.lang;
    if(!byName||byNameLang!==lang){byName=new Map();byNameLang=lang;for(const m of Object.values(G.Moves.BY_ID)){byName.set(T(m.name,'move'),m);byName.set(m.name,m);}}
    return byName.get(name);
  }
  function moveOf(el){
    const id=el.getAttribute('data-ps-move');
    if(id)return G.Moves.BY_ID[id]||null;
    return moveByName(el.getAttribute('title'));
  }
  const idOf=m=>Object.keys(G.Moves.BY_ID).find(k=>G.Moves.BY_ID[k]===m)||m.id;

  // ---------- forgetting TM moves ----------
  const inRun=()=>['playing','paused','held'].includes(G.Game&&G.Game.state)||!!(G.Game&&G.Game.player&&G.Game.state!=='ui'&&G.Game.state!=='over');
  const currentDex=()=>G.DexExtras?G.DexExtras.currentDex():0;
  const taught=dex=>{try{return (G.Mons.taught(dex)||[]).map(x=>typeof x==='string'?x:x&&x.id);}catch(_){return [];}};
  // Forgotten moves per account, kept on this device: the client merges a
  // cloud save with the local one by joining their TM lists, which would bring
  // a forgotten move back from an older copy. Teaching it again clears this.
  const KEY='ps.forgottenTm';
  const account=()=>{try{return DB.mode+':'+(DB.user||'guest');}catch(_){return 'guest';}};
  const readAll=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){return {};}};
  const writeAll=all=>{try{localStorage.setItem(KEY,JSON.stringify(all));}catch(_){}};
  function tomb(dex,move,on){
    const all=readAll(),a=all[account()]=all[account()]||{},list=a[dex]||[];
    a[dex]=on?[...new Set(list.concat(move))]:list.filter(x=>x!==move);
    if(!a[dex].length)delete a[dex];
    writeAll(all);
  }
  function drop(save,dex,move){
    const list=save.ptm&&save.ptm[dex];
    if(!Array.isArray(list)||!list.includes(move))return false;
    const left=list.filter(x=>x!==move);
    if(left.length)save.ptm[dex]=left;else delete save.ptm[dex];
    // A forgotten move can no longer be the chosen starting move.
    for(const k of ['pstart','pstart2'])if(save[k]&&save[k][dex]===move)delete save[k][dex];
    return true;
  }
  function save(){
    try{DB.commit();}catch(_){}
    try{if(typeof DB.saveNow==='function')DB.saveNow();}catch(_){}
  }
  function forget(dex,move){
    const s=DB&&DB.save;
    if(!s||inRun()||!drop(s,dex,move))return false;
    tomb(dex,move,true);save();return true;
  }
  // Re-apply after a sync brought a forgotten move back.
  function enforce(){
    const s=DB&&DB.save;if(!s||inRun())return;
    const mine=readAll()[account()];if(!mine)return;
    let changed=false;
    for(const dex of Object.keys(mine))for(const move of mine[dex])changed=drop(s,dex,move)||changed;
    if(changed)save();
  }
  setInterval(enforce,4000);
  if(G.Mons&&typeof G.Mons.teach==='function'){
    const teach=G.Mons.teach;
    G.Mons.teach=function(dex,move){const ok=teach.apply(this,arguments);if(ok)tomb(dex,move,false);return ok;};
  }
  function refreshDex(dex){
    const cell=[...document.querySelectorAll('#dex-grid > .cell')].find(c=>{const n=c.querySelector('.no');return n&&+n.textContent===+dex;});
    if(cell)cell.click();
  }

  // ---------- popup ----------
  const tip=document.getElementById('ps-move-tip')||document.createElement('div');
  tip.id='ps-move-tip';tip.className='box';tip.setAttribute('translate','no');tip.hidden=true;
  if(!tip.parentNode)document.body.appendChild(tip);
  let tipFor=null,armed=0;
  function hideTip(){tip.hidden=true;tipFor=null;armed=0;}
  function forgettable(anchor,id){
    if(!detail||!detail.contains(anchor)||!dexScreen||dexScreen.classList.contains('hidden'))return 0;
    const dex=currentDex();
    try{if(!dex||!DB.owns(dex))return 0;}catch(_){return 0;}
    return taught(dex).includes(id)?dex:0;
  }
  function showTip(anchor,m){
    const t=text(),id=idOf(m),color=(G.U&&G.U.TYPE_COLOR&&G.U.TYPE_COLOR[m.type])||'#888';
    const typeName=T((G.U&&G.U.TYPE_NAME&&G.U.TYPE_NAME[m.type])||m.type);
    const cat=m.cat&&G.Stats&&G.Stats.NAME?T(G.Stats.NAME[m.cat]):'';
    const stats=[m.dmg?t.power+' '+m.dmg:'',m.cd?t.cd+' '+m.cd+' '+t.sec:''].filter(Boolean).join(' · ');
    const dex=forgettable(anchor,id);
    tip.innerHTML=`<div class="ps-tip-head"><b>${esc(T(m.name,'move'))}</b><span class="ps-tip-type" style="background:${esc(color)}">${esc(typeName)}</span>${cat?`<span class="ps-tip-cat ${m.cat==='special'?'sp':'ph'}">${esc(cat)}</span>`:''}</div>`
      +(stats?`<div class="ps-tip-stats">${esc(stats)}</div>`:'')+`<p>${esc(T(m.desc||''))}</p>`
      +(dex?`<div class="ps-tip-tm"><small>${esc(t.taught)}</small><button type="button" class="btn small" data-ps-forget="${esc(id)}">${esc(t.forget)}</button></div>`:'');
    tip.hidden=false;tipFor=anchor;armed=0;
    const forgetBtn=tip.querySelector('[data-ps-forget]');
    if(forgetBtn)forgetBtn.addEventListener('click',event=>{
      event.stopPropagation();
      if(inRun()){try{G.UI.toast(t.inRun,2500);}catch(_){}return;}
      if(!armed||performance.now()-armed>5000){armed=performance.now();forgetBtn.textContent=t.confirm;forgetBtn.classList.add('ps-danger');return;}
      if(forget(dex,id)){hideTip();try{G.UI.toast(t.forgot(T(m.name,'move')),2500);}catch(_){}refreshDex(dex);}
    });
    const r=anchor.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
    const x=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8);
    let y=r.top-h-8;if(y<8)y=Math.min(innerHeight-h-8,r.bottom+8);
    tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px';
  }
  // Capture phase: a move icon inside a button (shop item, starting move chip,
  // level-up card) shows its info instead of pressing the button. The rest of
  // the button still works as before.
  document.addEventListener('click',event=>{
    const target=event.target;
    if(!target||!target.closest||tip.contains(target))return;
    const el=target.closest('[data-ps-move]')||target.closest('#scr-dex .move-icons span[title]');
    const m=el&&moveOf(el);
    if(!m){if(!tip.hidden)hideTip();return;}
    event.stopPropagation();event.preventDefault();
    if(tipFor===el)hideTip();else showTip(el,m);
  },true);
  addEventListener('resize',hideTip);
  document.addEventListener('scroll',()=>{if(!tip.hidden)hideTip();},true);
  // The icon went away (screen closed or re-rendered): close its popup.
  setInterval(()=>{if(!tip.hidden&&tipFor&&(!tipFor.isConnected||!tipFor.getClientRects().length))hideTip();},400);
  G.MoveInfo={show:showTip,hide:hideTip,forget,enforce,forgotten:()=>readAll()[account()]||{}};
})();
