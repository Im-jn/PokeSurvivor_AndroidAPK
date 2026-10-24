/* Integrated resource map: native HUD + PMD menu, using read-only world queries. */
G.MapUI = (() => {
  const $ = id => document.getElementById(id);
  const types = {
    chest: ['Cofre pequeño', '#ffd23f'], bigchest: ['Cofre grande', '#c47bff'],
    altar: ['Altar', '#bd9cff'], spring: ['Manantial', '#74eed3'],
    trap: ['Trampa', '#fa8b91'], rock: ['Roca', '#a8b7c3'], tree: ['Árbol', '#4bc983']
  };
  const tr = s => G.T(s);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let opened = false, pauseToken = null, previousFocus = null, pan = {x:0,y:0}, range = 96;
  let mini = null, miniAt = 0, sample = null, plotted = [], drag = null;
  const pointers = new Map();
  const filters = () => new Set(G.Settings.get('mapFilters') || ['chest','bigchest','altar','spring']);
  const active = () => G.Game.player && ['playing','paused','held'].includes(G.Game.state);

  // Shared by HUD, full map and legend. Shape encodes type; color is secondary.
  function symbol(ctx,type,x,y,scale=1,predicted=false) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=1.5;ctx.strokeStyle='#08142a';
    const box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);};
    if(predicted){ctx.strokeStyle='#e4efff';ctx.lineWidth=1;ctx.setLineDash([2,2]);ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#08142a';ctx.globalAlpha=.8;}
    if(type==='chest'||type==='bigchest'){
      const big=type==='bigchest', w=big?13:11;
      box(-w/2,-4,w,9,big?'#ba7fff':'#ffc449');
      ctx.beginPath();ctx.moveTo(-w/2,-1);ctx.lineTo(w/2,-1);ctx.stroke();
      if(big){ctx.strokeStyle='#fff09a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-1.5,2,-Math.PI,0);ctx.stroke();box(-2,0,4,3,'#ffe787');}
      else box(-1,-1,2,3,'#fff3b0');
    }else if(type==='altar'){
      ctx.fillStyle='#d4a7ff';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,-1);ctx.lineTo(0,4);ctx.lineTo(-5,-1);ctx.closePath();ctx.fill();ctx.stroke();box(-4,4,8,2,'#a582d9');
      ctx.fillStyle='#fff4ff';ctx.fillRect(-1,-4,2,4);
    }else if(type==='spring'){
      ctx.fillStyle='#62f4e5';ctx.beginPath();ctx.moveTo(0,-7);ctx.bezierCurveTo(-1,-4,-6,0,-5,3);ctx.bezierCurveTo(-4,8,4,8,5,3);ctx.bezierCurveTo(6,0,1,-4,0,-7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';ctx.fillRect(-3,1,6,2);ctx.fillRect(-1,-1,2,6);
    }else if(type==='trap'){
      ctx.fillStyle='#ff8d9c';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,6);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#251222';ctx.fillRect(-1,-3,2,5);ctx.fillRect(-1,3,2,2);
    }else if(type==='tree'){
      box(-1,2,2,5,'#b08052');ctx.fillStyle='#5cda79';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(6,3);ctx.lineTo(-6,3);ctx.closePath();ctx.fill();ctx.stroke();
    }else if(type==='rock'){
      ctx.fillStyle='#acb5c5';ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(-4,-3);ctx.lineTo(2,-5);ctx.lineTo(6,0);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.stroke();
    }else if(type==='player'){
      ctx.fillStyle='#ffe16d';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,6);ctx.lineTo(0,3);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();
    }else if(type==='ally'){
      ctx.fillStyle='#7fff9d';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#12352b';ctx.fillRect(-1,-3,2,6);ctx.fillRect(-3,-1,6,2);
    }else if(type==='rift'){
      ctx.fillStyle='#512779';ctx.beginPath();ctx.ellipse(0,0,4,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f3b8ff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(-1,-4,2,5);
    }
    ctx.restore();
  }

  function legendIcons() {
    for(const cv of document.querySelectorAll('#map-filters canvas, #map-legend canvas')){
      cv.width=cv.height=40;symbol(cv.getContext('2d'),cv.dataset.symbol,20,20,1.8,cv.dataset.predicted==='1');
    }
  }

  function settingsHTML() {
    const toggle = (key, label, sub) => `<div class="set-row"><div class="grow"><b>${escape(tr(label))}</b><small>${escape(tr(sub))}</small></div><button class="btn small switch ${G.Settings.get(key) ? 'gold' : ''}" data-k="${key}">${escape(tr(G.Settings.get(key) ? 'Sí' : 'No'))}</button></div>`;
    return `<h3 class="set-h">${escape(tr('Mapa de recursos'))}</h3>`
      + toggle('minimap','Minimapa de combate','Toca el minimapa o pulsa M para abrir el mapa.')
      + toggle('mapPredict','Mostrar predicciones','Contornos: recursos aún no cargados; pueden haber cambiado.')
      + toggle('mapTerrain','Mostrar terreno','Suelo, paredes y agua.')
      + `<p class="note">${escape(tr('Los filtros y el zoom se guardan en este dispositivo.'))}</p>`;
  }

  function syncControls() {
    const selected = filters();
    $('map-filters').innerHTML = Object.entries(types).map(([key, [name]]) => `<button class="chip ${selected.has(key) ? 'on' : ''}" data-resource="${key}" aria-pressed="${selected.has(key)}"><canvas data-symbol="${key}" aria-hidden="true"></canvas>${escape(tr(name))}</button>`).join('');
    $('map-options').innerHTML = ['mapPredict','mapTerrain'].map((key,i) => `<button class="btn small ${G.Settings.get(key) ? 'gold' : ''}" data-option="${key}" aria-pressed="${!!G.Settings.get(key)}">${escape(tr(i ? 'Mostrar terreno' : 'Mostrar predicciones'))}: ${escape(tr(G.Settings.get(key) ? 'Sí' : 'No'))}</button>`).join('');
    $('map-legend').innerHTML = [['player','Tu posición'],['ally','Aliado en el mapa'],['rift','Entrada de grieta'],['chest','Recurso previsto']].map(([key,label],i)=>`<span><canvas data-symbol="${key}" data-predicted="${i===3?1:0}" aria-hidden="true"></canvas>${escape(tr(label))}</span>`).join('')+`<p>${escape(tr('Verde: suelo · gris: paredes · azul: agua'))}</p>`;
    legendIcons();
    if(G.World.mapExplorationOnly){
      $('map-options').querySelector('[data-option="mapPredict"]')?.remove();
      $('map-legend').querySelector('[data-predicted="1"]')?.parentElement.remove();
      const note=$('scr-map').querySelector('.map-tools > p.note');
      if(note)note.textContent='地图记录已探索区域；深色为未探索区域。资源状态以最近一次探索时为准。';
    }
  }

  function init() {
    const legend=document.createElement('div');legend.id='map-legend';$('map-options').after(legend);
    $('map-title').after($('map-session'));$('map-session').classList.add('map-pause-status');
    $('btn-pause-map').onclick = open;
    $('map-close').onclick = close;
    $('map-out').onclick = () => zoom(1.25);
    $('map-in').onclick = () => zoom(0.8);
    $('map-center').onclick = () => { pan = {x:0,y:0}; clearSelection(); render(); };
    $('map-filters').onclick = e => {
      const key = e.target.closest('[data-resource]')?.dataset.resource; if (!key) return;
      const selected = filters(); selected.has(key) ? selected.delete(key) : selected.add(key);
      G.Settings.set('mapFilters', [...selected]);
    };
    $('map-options').onclick = e => {
      const key = e.target.closest('[data-option]')?.dataset.option;
      if (key) G.Settings.set(key, !G.Settings.get(key));
    };
    G.Settings.on(() => { miniAt = 0; if (isOpen()) { syncControls(); render(); } });
    addEventListener('keydown', keydown, true);
    addEventListener('resize', () => { miniAt = 0; if (isOpen()) render(); });
    const canvas = $('resource-map');
    canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15); }, {passive:false});
    canvas.addEventListener('pointerdown', e => {
      if (e.button && e.pointerType === 'mouse') return;
      e.preventDefault(); canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
      drag = {x:e.clientX,y:e.clientY, moved:false};
    });
    canvas.addEventListener('pointermove', e => {
      const old = pointers.get(e.pointerId); if (!old) return;
      const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)?.[1];
      pointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
      if (other) {
        const before = Math.hypot(old.x-other.x, old.y-other.y), after = Math.hypot(e.clientX-other.x,e.clientY-other.y);
        if (before > 5 && after > 5) zoom(before / after);
        drag.moved = true;
      } else {
        const scale = range / canvas.getBoundingClientRect().width;
        pan.x = G.U.clamp(pan.x - (e.clientX-old.x)*scale, -8192, 8192);
        pan.y = G.U.clamp(pan.y - (e.clientY-old.y)*scale, -8192, 8192);
        if (Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5) drag.moved = true;
        render();
      }
    });
    function end(e) {
      if (!pointers.has(e.pointerId)) return;
      const click = e.type === 'pointerup' && !drag?.moved && pointers.size === 1;
      pointers.delete(e.pointerId);
      if (click) select(e);
      if (!pointers.size) drag = null;
    }
    for (const name of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(name, end);
    setInterval(() => { if (isOpen()) render(); else if(opened) close(); }, 300);
  }

  function isOpen() { return opened && !$('scr-map').classList.contains('hidden'); }
  function open() {
    if (!active() || isOpen() || G.Judgment?.cinematic) return;
    if (document.querySelector('#scr-settings:not(.hidden), #scr-levelup:not(.hidden), #scr-item:not(.hidden), #scr-bond:not(.hidden)')) return;
    previousFocus = document.activeElement;
    G.Input.reset(); G.Touch.reset(); pan = {x:0,y:0};
    range = Number(G.Settings.get('mapRange')) || 96;
    range = G.U.clamp(range, 24, 160);
    opened = true;
    $('scr-map').classList.remove('hidden');
    pauseToken = G.Game.pauseForMap();
    clearSelection(); syncControls(); render(); $('map-close').focus();
  }
  function close() {
    opened = false;
    $('scr-map').classList.add('hidden'); pointers.clear(); drag = null;
    G.Input.reset(); G.Touch.reset();
    if(pauseToken)G.Game.resumeFromMap(pauseToken);
    pauseToken = null;
    if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
  }
  function keydown(e) {
    const editing = e.target.closest?.('input,textarea,select,[contenteditable="true"]');
    if (editing || e.ctrlKey || e.altKey || e.metaKey) return;
    const mapKey = e.code === 'KeyM';
    if (!isOpen()) {
      if (mapKey && !e.repeat && active()) { e.preventDefault(); e.stopImmediatePropagation(); open(); }
      return;
    }
    if (e.key === 'Tab') {
      const focusable = [...$('scr-map').querySelectorAll('button, [tabindex="0"]')];
      const index = focusable.indexOf(document.activeElement);
      const next = (index + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      e.preventDefault(); e.stopImmediatePropagation(); focusable[next].focus(); return;
    }
    if (mapKey || e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) close(); return; }
    if (['+','=','-','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.key==='+' || e.key==='=') zoom(.8);
      else if (e.key==='-') zoom(1.25);
      else if (e.key==='Home') {pan={x:0,y:0};render();}
      else { const step=range/8; pan.x+= e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0; pan.y+=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0; render(); }
    } else if (!['Enter',' '].includes(e.key)) { e.stopImmediatePropagation(); }
  }
  function zoom(factor) {
    range = G.U.clamp(Math.round(range*factor), 24, 160);
    G.Settings.set('mapRange', range); clearSelection(); render();
  }
  function clearSelection() { $('map-selection').textContent = tr('Selecciona un recurso para ver su distancia.'); }

  function snapshot(cx,cy,span) {
    const startX = Math.floor(cx-span/2), startY = Math.floor(cy-span/2);
    return G.World.mapSample(startX,startY,span,span,!!G.Settings.get('mapPredict'));
  }
  function watermark(ctx,size,displaySize,compact,bottom=size) {
    const scale=size/Math.max(1,displaySize), pad=5*scale;
    const label='b站 秘制のJN 制作';
    ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    let font=(compact?8:10)*scale;
    ctx.font=font+'px system-ui,"Microsoft YaHei",sans-serif';
    const width=ctx.measureText(label).width;
    if(width>size-pad*2){font*=((size-pad*2)/width);ctx.font=font+'px system-ui,"Microsoft YaHei",sans-serif';}
    ctx.textAlign='right';ctx.textBaseline='bottom';ctx.lineJoin='round';
    ctx.lineWidth=2*scale;ctx.strokeStyle='rgba(5,15,35,.9)';ctx.fillStyle='rgba(240,247,255,.9)';
    ctx.strokeText(label,size-pad,bottom-pad);ctx.fillText(label,size-pad,bottom-pad);
    ctx.restore();
  }
  function paint(ctx,size,s,pl,compact,displaySize=size) {
    const k=size/s.cols, selected=filters(), output=[];
    ctx.clearRect(0,0,size,size); ctx.fillStyle='#0b1838';ctx.fillRect(0,0,size,size);
    if (G.Settings.get('mapTerrain')) {
      const liquid = {water:'#376a9c',swamp:'#42695d',lava:'#ac5036',poison:'#80558b',spark:'#9a873e',ice:'#7b9bb1'}[G.World.liquidKind()] || '#376a9c';
      const palette=['#42654d','#737b91',liquid,'#0b1838'];
      ctx.globalAlpha=compact?.8:.9;
      for (let y=0;y<s.rows;y++) for(let x=0;x<s.cols;x++) {
        ctx.fillStyle=palette[s.terrain[y*s.cols+x]];ctx.fillRect(x*k,y*k,Math.ceil(k),Math.ceil(k));
      }
      ctx.globalAlpha=1;
    }
    const point=(x,y)=>[(x/32-s.tx0)*k,(y/32-s.ty0)*k];
    const occupied=[],priority={bigchest:7,spring:6,altar:5,chest:4,trap:3,rock:2,tree:1};
    const ordered=compact?[...s.props].sort((a,b)=>Number(a.predicted)-Number(b.predicted)||(priority[b.type]||0)-(priority[a.type]||0)):s.props;
    const markerScale=compact?size/displaySize*.8:1.05;
    for (const p of ordered) {
      if (!selected.has(p.type)) continue;
      const x=(p.tx+.5-s.tx0)*k,y=(p.ty+.5-s.ty0)*k;
      if(compact&&occupied.some(q=>Math.hypot(q.x-x,q.y-y)<14*markerScale))continue;
      if(compact)occupied.push({x,y});
      symbol(ctx,p.type,x,y,markerScale,p.predicted);
      output.push({...p,sx:x,sy:y});
    }
    const marker=(x,y,type)=>{const [px,py]=point(x,y);if(px<0||py<0||px>size||py>size)return;symbol(ctx,type,px,py,markerScale);};
    if(G.Coop.active)for(const member of G.Coop.puppets())marker(member.x,member.y,'ally');
    const rift=G.Rift.rift;if(rift)marker(rift.x,rift.y,'rift');
    const [px,py]=point(pl.x,pl.y);
    if(px>=0&&py>=0&&px<=size&&py<=size)symbol(ctx,'player',px,py,markerScale);
    if(!compact)watermark(ctx,size,displaySize,false);
    return output;
  }
  function render() {
    if(!isOpen())return;
    if(!active()){close();return;}
    const pl=G.Game.player, cv=$('resource-map');
    $('map-session').textContent=tr(pauseToken?.coop&&G.Game.state==='playing'?'Solicitando pausa al grupo…':'Partida en pausa.');
    const px=Math.min(800,Math.max(240,Math.round(cv.getBoundingClientRect().width*Math.min(1.5,devicePixelRatio||1))))||480;
    if(cv.width!==px){cv.width=cv.height=px;}
    sample=snapshot(pl.x/32+pan.x,pl.y/32+pan.y,range);
    const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
    plotted=paint(ctx,px,sample,pl,false,cv.getBoundingClientRect().width);
    $('map-status').textContent=tr(G.World.biomeName())+' · '+range+' × '+range+' '+tr('casillas');
    const actual=plotted.filter(p=>!p.predicted).length;
    $('map-status').textContent+=' · '+actual+' '+tr('confirmados')+' / '+(plotted.length-actual)+' '+tr('predichos');
  }
  function select(e) {
    if(!sample)return;
    const cv=$('resource-map'),rect=cv.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*cv.width,y=(e.clientY-rect.top)/rect.height*cv.height;
    const nearest=plotted.reduce((a,p)=>Math.hypot(p.sx-x,p.sy-y)<Math.hypot((a?.sx??Infinity)-x,(a?.sy??Infinity)-y)?p:a,null);
    if(!nearest||Math.hypot(nearest.sx-x,nearest.sy-y)>Math.max(14,cv.width/rect.width*16)){clearSelection();return;}
    const p=G.Game.player, dist=Math.round(Math.hypot((nearest.tx+.5)*32-p.x,(nearest.ty+.5)*32-p.y)/32);
    $('map-selection').textContent=tr(types[nearest.type][0])+' · ('+nearest.tx+', '+nearest.ty+') · '+dist+' '+tr('casillas')+' · '+tr(nearest.predicted?'Predicción':'Confirmado');
  }
  function drawHUD(ctx,w,h,pl) {
    if(!G.Settings.get('minimap')||isOpen()||h<270)return;
    const size=h<340?84:h<420?96:112, sa=G.Touch.safeArea();
    const x=w-size-16-sa.right,y=66+sa.top;
    const now=performance.now();
    if(!mini)mini=document.createElement('canvas');
    if(!miniAt||now-miniAt>350){
      if(mini.width!==144)mini.width=mini.height=144; // resizing reallocates the canvas
      const s=snapshot(pl.x/32,pl.y/32,64);paint(mini.getContext('2d'),144,s,pl,true,size);miniAt=now;
    }
    ctx.save();ctx.fillStyle='rgba(26,49,112,.85)';ctx.strokeStyle='#f4f8ff';ctx.lineWidth=2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x-3,y-3,size+6,size+36,7);
    else ctx.rect(x-3,y-3,size+6,size+36);
    ctx.fill();ctx.stroke();
    ctx.drawImage(mini,x,y,size,size);
    ctx.font='700 10px Pixelify,system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd23f';
    ctx.fillText(tr('Mapa')+' · M',x+size/2,y+size+12);
    ctx.save();ctx.translate(x,y);watermark(ctx,size,size,true,size+32);ctx.restore();
    ctx.restore();
    G.Touch.addButton(x-3,y-3,size+6,size+36,open,0);
  }
  return {init,open,close,drawHUD,settingsHTML,get isOpen(){return isOpen();}};
})();
