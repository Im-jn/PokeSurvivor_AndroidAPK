// Dual-stick touch controls: movement stick + attack stick, multi-touch.
//
// Moves keep firing by themselves (official behaviour). Holding the attack
// stick aims them: in the dragged direction, else the last dragged one, else
// where the Pokémon faces; with no enemy in reach, area moves are still cast
// at a point in that direction.
// Attack stick placement (Settings > Controls > Layout, like the joystick):
//   float  left half of the screen moves, right half attacks, wherever touched
//   fixed  a stick at a draggable position; the rest of the screen moves.
//
// The official Touch module handles one pointer and drops the stick when the
// level-up cards appear. Pointers that do not hit an official on-screen button
// are taken here instead (all of them, independently), so moving, attacking
// and tapping buttons work at the same time and a held finger keeps moving
// after a menu closes. Buttons (moves, pause, minimap) still go to the game.
(() => {
  const Player=G.Player,Touch=G.Touch,canvas=document.getElementById('game');
  if(!Player||!Touch||!canvas||typeof Player.prototype.update!=='function')return;
  const STICK_KEY='ps.attackStick';
  const TEXT={
    zh:{layTitle:'攻击键',float:'浮动',fixed:'固定',tag:'攻击键'},
    en:{layTitle:'Attack',float:'Floating',fixed:'Fixed',tag:'Attack stick'},
    es:{layTitle:'Ataque',float:'Flotante',fixed:'Fijo',tag:'Stick de ataque'}
  };
  const text=()=>{const l=String(G.I18n&&G.I18n.lang||'');return /^zh/.test(l)?TEXT.zh:l==='es'?TEXT.es:TEXT.en;};
  const read=(key,fallback)=>{try{const v=localStorage.getItem(key);return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,value);}catch(_){}};
  const DEF_POS=[0.84,0.64];
  try{localStorage.removeItem('ps.attackMode');}catch(_){} // old auto/manual switch
  let stickCfg=(()=>{try{const v=JSON.parse(read(STICK_KEY,'null'));if(v&&(v.mode==='fixed'||v.mode==='float'))return {mode:v.mode,pos:Array.isArray(v.pos)?v.pos:DEF_POS};}catch(_){}return {mode:'float',pos:DEF_POS};})();
  const R=()=>Touch.R?Touch.R():56;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const W=()=>canvas.clientWidth||innerWidth,H=()=>canvas.clientHeight||innerHeight;
  function attackBase(pos=stickCfg.pos){const r=R();return {x:clamp(pos[0]*W(),r+4,W()-r-4),y:clamp(pos[1]*H(),r+4,H()-r-4)};}
  const moveFixed=()=>G.Settings.get('stickMode')==='fixed';

  // ---------- sticks ----------
  let move=null,attack=null;
  const attacking=()=>!!attack;
  // Last direction the attack stick was dragged: a held, undragged stick keeps it.
  let lastAim=null;
  function dragAngle(){if(!attack)return null;const dx=attack.x-attack.ox,dy=attack.y-attack.oy;if(Math.hypot(dx,dy)<=10)return null;return lastAim=Math.atan2(dy,dx);}
  // While the attack stick is held: drag direction, else last drag, else facing.
  function aimAngle(player){
    const drag=dragAngle();
    if(drag!=null)return drag;
    if(attacking())return lastAim!=null?lastAim:player&&typeof player.aim==='number'?player.aim:0;
    return null;
  }
  function follow(s){
    if(s.fixed)return;
    const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy),r=R();
    if(d>r){s.ox=s.x-dx/d*r;s.oy=s.y-dy/d*r;}
  }
  // Official on-screen buttons, mirrored so their taps are left to the game.
  let buttons=[];
  const clearButtons=Touch.clearButtons,addButton=Touch.addButton;
  Touch.clearButtons=function(){buttons=[];return clearButtons.apply(this,arguments);};
  Touch.addButton=function(x,y,w,h,fn,pad=6){buttons.push({x,y,w,h,pad});return addButton.apply(this,arguments);};
  const onButton=(x,y)=>buttons.some(b=>x>=b.x-b.pad&&x<=b.x+b.w+b.pad&&y>=b.y-b.pad&&y<=b.y+b.h+b.pad);

  addEventListener('pointerdown',event=>{
    if(event.target!==canvas||event.pointerType==='mouse'||!G.Game||G.Game.state!=='playing')return;
    const x=event.clientX,y=event.clientY;
    if(onButton(x,y))return; // move slots, pause, minimap: official handler
    event.stopImmediatePropagation();event.preventDefault();
    if(!document.body.classList.contains('touch'))document.body.classList.add('touch');
    const r=R(),id=event.pointerId;
    let role;
    if(stickCfg.mode==='fixed'){const b=attackBase();role=Math.hypot(x-b.x,y-b.y)<=2.2*r?'attack':'move';}
    else role=x>=W()/2?'attack':'move';
    if(role==='attack'){
      if(attack)return;
      const b=stickCfg.mode==='fixed'?attackBase():{x,y};
      attack={id,ox:b.x,oy:b.y,x,y,fixed:stickCfg.mode==='fixed'};
    }else{
      if(move)return;
      if(moveFixed()){const b=Touch.stickBase();if(Math.hypot(x-b.x,y-b.y)>2.2*r)return;move={id,ox:b.x,oy:b.y,x,y,fixed:true};}
      else move={id,ox:x,oy:y,x,y};
    }
    try{canvas.setPointerCapture(id);}catch(_){}
  },true);
  addEventListener('pointermove',event=>{
    for(const s of [move,attack])if(s&&s.id===event.pointerId){s.x=event.clientX;s.y=event.clientY;follow(s);}
  },true);
  const end=event=>{if(move&&move.id===event.pointerId)move=null;if(attack&&attack.id===event.pointerId)attack=null;};
  addEventListener('pointerup',end,true);addEventListener('pointercancel',end,true);
  const clearAll=()=>{move=null;attack=null;};
  addEventListener('blur',clearAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearAll();});

  const vector=Touch.vector;
  Touch.vector=function(){
    if(!move)return vector.apply(this,arguments);
    const dx=move.x-move.ox,dy=move.y-move.oy,d=Math.hypot(dx,dy);
    if(d<7)return [0,0];
    const k=Math.min(1,(d-7)/(0.5*R()-7));return [dx/d*k,dy/d*k];
  };
  // Touch.reset (menus, map) only drops the official stick: ours lives until
  // the finger lifts, so movement continues after the level-up cards.
  function drawAttack(ctx,s,r,alpha){
    const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy),kx=s.ox+(d>r?dx/d*r:dx),ky=s.oy+(d>r?dy/d*r:dy);
    ctx.save();
    ctx.globalAlpha=0.5*alpha;ctx.fillStyle='rgba(48,10,16,.55)';ctx.beginPath();ctx.arc(s.ox,s.oy,r,0,6.2832);ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='#ff8a6b';ctx.stroke();
    ctx.globalAlpha=0.85*alpha;ctx.fillStyle='#ff6b4a';ctx.beginPath();ctx.arc(kx,ky,0.42*r,0,6.2832);ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='#8a1f10';ctx.stroke();
    ctx.restore();
  }
  function drawButton(ctx,x,y,r){
    ctx.save();
    ctx.globalAlpha=0.85;
    ctx.fillStyle='rgba(120,24,16,.55)';ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='#ff8a6b';ctx.stroke();
    ctx.fillStyle='#ff6b4a';ctx.beginPath();ctx.arc(x,y,0.62*r,0,6.2832);ctx.fill();
    ctx.lineWidth=2.5;ctx.strokeStyle='#8a1f10';ctx.stroke();
    // Three claw marks.
    ctx.strokeStyle='#fff2e8';ctx.lineWidth=Math.max(2,0.09*r);ctx.lineCap='round';ctx.beginPath();
    for(const k of [-1,0,1]){ctx.moveTo(x-0.26*r+k*0.2*r,y+0.3*r);ctx.lineTo(x+0.18*r+k*0.2*r,y-0.3*r);}
    ctx.stroke();ctx.restore();
  }
  const draw=Touch.draw;
  Touch.draw=function(ctx){
    const touch=document.body.classList.contains('touch'),r=R();
    if(!move&&(Touch.stick||!touch))draw.apply(this,arguments);
    else if(move)Touch.drawStick(ctx,move,r,1);
    else if(moveFixed()){const b=Touch.stickBase();Touch.drawStick(ctx,{ox:b.x,oy:b.y,x:b.x,y:b.y},r,0.55);}
    if(attack)drawAttack(ctx,attack,r,1);
    else if(touch&&G.Game.state==='playing'){const b=attackBase();drawButton(ctx,b.x,b.y,0.62*r);}
  };

  // ---------- aiming (local player only) ----------
  const update=Player.prototype.update;
  Player.prototype.update=function(dt,...rest){
    const result=update.call(this,dt,...rest);
    const local=this===G.Game.player&&!this.remote;
    if(local&&attacking()&&!this.dead){
      // No enemy in reach: aim area moves (meteors, vortex...) at a point along
      // the attack direction, so they can still be fired on purpose.
      const a=typeof this.aim==='number'?this.aim:0,t=this.target;
      if(!t||t.dead||Math.hypot(t.x-this.x,t.y-this.y)>320)this.target={x:this.x+150*Math.cos(a),y:this.y+150*Math.sin(a),r:0,hp:1,dead:false,psVirtual:true};
    }
    return result;
  };
  // Meteors pick enemies near the player, otherwise random spots. Aimed by
  // hand with nobody around, drop them around the aimed point instead: the
  // effect runs right after Player.cast, so answer its one enemy query.
  const cast=Player.prototype.cast;
  Player.prototype.cast=function(m,...rest){
    const t=this.target;
    if(m&&m.kind==='meteor'&&t&&t.psVirtual&&G.EnemyMgr&&typeof G.EnemyMgr.queryCircle==='function'){
      const query=G.EnemyMgr.queryCircle,n=Math.max(1,m.count|0);
      G.EnemyMgr.queryCircle=function(){G.EnemyMgr.queryCircle=query;return Array.from({length:n},()=>({x:t.x+(Math.random()-0.5)*60,y:t.y+(Math.random()-0.5)*50,dead:false}));};
      setTimeout(()=>{if(G.EnemyMgr.queryCircle!==query)G.EnemyMgr.queryCircle=query;},0);
    }
    return cast.call(this,m,...rest);
  };
  const handAim=Player.prototype.handAim;
  Player.prototype.handAim=function(){
    const a=this===G.Game.player&&!this.remote?aimAngle(this):null;
    if(a!=null)return a;
    return handAim?handAim.apply(this,arguments):null;
  };
  // The game draws a crosshair whenever the aim is manual (meant for mouse and
  // gamepad). With touch aiming it sat at a stale mouse position: casting has
  // already read manualAim by the end of Combat.tick, so clear it before drawing.
  if(G.Combat&&typeof G.Combat.tick==='function'){
    const tick=G.Combat.tick;
    G.Combat.tick=function(dt,player,...rest){
      const result=tick.call(this,dt,player,...rest);
      const p=G.Game.player;
      if(p&&p.manualAim&&attack&&!(G.Pad&&G.Pad.aim&&G.Pad.aim()))p.manualAim=false;
      return result;
    };
  }


  // ---------- layout editor: attack stick floating / fixed + position ----------
  if(G.LayoutUI&&typeof G.LayoutUI.open==='function'){
    const open=G.LayoutUI.open;
    let draft=null;
    G.LayoutUI.open=function(){
      const result=open.apply(this,arguments);
      const modeRow=document.getElementById('lay-mode');
      const root=modeRow&&modeRow.closest('section');
      if(!root)return result;
      draft={mode:stickCfg.mode,pos:stickCfg.pos.slice()};
      const t=text();
      let row=document.getElementById('ps-lay-atk'),thing=root.querySelector('.ps-lay-atk');
      if(!row){
        row=document.createElement('div');row.id='ps-lay-atk';row.className='chips set-chips';row.setAttribute('translate','no');
        modeRow.after(row);
        row.addEventListener('click',event=>{const b=event.target.closest('[data-m]');if(!b)return;draft.mode=b.dataset.m;sync();});
        thing=document.createElement('div');thing.className='lay-thing lay-stick ps-lay-atk';thing.setAttribute('translate','no');
        thing.innerHTML='<div class="knob"></div><span class="lay-tag"></span>';root.appendChild(thing);
        let grab=null;
        thing.addEventListener('pointerdown',event=>{event.preventDefault();const b=attackBase(draft.pos);grab=[event.clientX-b.x,event.clientY-b.y];thing.classList.add('held');try{thing.setPointerCapture(event.pointerId);}catch(_){}});
        thing.addEventListener('pointermove',event=>{if(!grab)return;draft.pos=[(event.clientX-grab[0])/W(),(event.clientY-grab[1])/H()];const b=attackBase(draft.pos);draft.pos=[b.x/W(),b.y/H()];sync();});
        const drop=()=>{grab=null;thing.classList.remove('held');};
        thing.addEventListener('pointerup',drop);thing.addEventListener('pointercancel',drop);
        root.addEventListener('click',event=>{
          if(!draft)return;
          if(event.target.closest('#lay-save')){stickCfg={mode:draft.mode,pos:draft.pos.map(v=>+v.toFixed(4))};write(STICK_KEY,JSON.stringify(stickCfg));}
          else if(event.target.closest('#lay-reset')){draft={mode:'float',pos:DEF_POS.slice()};setTimeout(sync);}
        },true);
        addEventListener('resize',()=>{if(draft&&!root.classList.contains('hidden'))sync();});
      }
      row.innerHTML=`<b>${t.layTitle}</b><button class="chip" data-m="float">${t.float}</button><button class="chip" data-m="fixed">${t.fixed}</button>`;
      thing.querySelector('.lay-tag').textContent=t.tag;
      function sync(){
        row.querySelectorAll('[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===draft.mode));
        const r=R(),b=attackBase(draft.pos);
        Object.assign(thing.style,{left:b.x-r+'px',top:b.y-r+'px',width:2*r+'px',height:2*r+'px'});
        thing.classList.toggle('hidden',draft.mode!=='fixed');
      }
      sync();
      return result;
    };
  }
  G.AttackButton={get attacking(){return attacking();},get aim(){return aimAngle(G.Game.player);},get sticks(){return {move,attack};},get placement(){return stickCfg.mode;},get buttons(){return buttons.slice();},setPlacement(m,pos){stickCfg={mode:m==='fixed'?'fixed':'float',pos:pos||stickCfg.pos};write(STICK_KEY,JSON.stringify(stickCfg));}};
})();
