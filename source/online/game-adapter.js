// Add features to the current client. Never replace its game loop, world or HUD.
(() => {
  const game=G.Game, world=G.World, hud=G.HUD;
  // Tile (x,y) -> one small integer (a V8 small int, no string per tile).
  const tileKey=(x,y)=>((x+16384)&32767)*32768+((y+16384)&32767);
  // One byte per tile in 64×64 blocks, least recently written blocks dropped first.
  function TileBytes(maxBlocks){
    const blocks=new Map();let lastKey=-1,last=null;
    return {
      get(x,y){const b=blocks.get(tileKey(x>>6,y>>6));return b?b[(y&63)*64+(x&63)]:0;},
      set(x,y,v){
        const k=tileKey(x>>6,y>>6);let b=k===lastKey?last:blocks.get(k);
        if(!b){if(blocks.size>=maxBlocks)blocks.delete(blocks.keys().next().value);b=new Uint8Array(4096);}
        if(k!==lastKey){blocks.delete(k);blocks.set(k,b);lastKey=k;last=b;}
        b[(y&63)*64+(x&63)]=v;
      },
      clear(){blocks.clear();lastKey=-1;last=null;},
    };
  }
  // Seen terrain: kind+1 (0 = not seen), 256 blocks = 1 MB, ~1M tiles.
  // Predicted: 1+terrain, +4 when the tile has a prop (specs), 0 = not computed.
  const terrain=TileBytes(256), predicted=TileBytes(64), specs=new Map(), props=new Map(), gone=new Set();
  let sampledAt=0, seed=1;
  const clearPredicted=()=>{predicted.clear();specs.clear();};
  const clear=()=>{terrain.clear();props.clear();gone.clear();clearPredicted();sampledAt=0;};
  const reset=world.reset;
  world.reset=function(s,...rest){seed=(s|0)||1;clear();return reset.call(this,s,...rest);};
  for(const key of ['setBiome','setArena']){
    const original=world[key];world[key]=function(...args){if(key==='setArena')clearPredicted();return original.apply(this,args);};
  }
  // Caps keep the map's memory small: Android kills WebViews that use too much.
  // Pure copy of the official generator (terrain + props, same constants and
  // hash). Never calls the live World: generating far chunks there would
  // allocate prop IDs and could desynchronize co-op games.
  const N=16,H=(x,y,s)=>G.U.hash(x,y,s);
  const vnoise=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=H(xi,yi,s),b=H(xi+1,yi,s),c=H(xi,yi+1,s),d=H(xi+1,yi+1,s);return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;};
  const fbm=(x,y,s)=>vnoise(x,y,s)*.65+vnoise(x*2.13+17,y*2.13-9,s+1)*.35;
  const arenaOf=()=>{const a=world.arena;return a&&a.th?a:null;};
  const arenaDist=(a,tx,ty)=>a?Math.hypot(tx-a.tx,ty-a.ty):Infinity;
  const arenaSafe=(a,tx,ty)=>{const lx=tx-a.tx,ly=ty-a.ty;return (Math.abs(lx)<=2&&ly>=-6&&ly<=5)||Math.hypot(lx,ly)<2.5;};
  function terrainRaw(tx,ty,a=arenaOf()){
    const ad=arenaDist(a,tx,ty);
    if(a&&ad<a.r+7){
      if(ad>=a.r)return 1;if(arenaSafe(a,tx,ty))return 0;const th=a.th;
      if(th.pillars&&ad<a.r-2&&H(tx>>1,ty>>1,seed+31+a.tx)<th.pillars)return 1;
      if(th.pools&&ad<a.r-1.5&&fbm(tx/3.2,ty/3.2,seed+37+a.tx)<th.pools)return 2;
      return 0;
    }
    const d=Math.hypot(tx,ty);if(d<9)return 0;
    const ramp=Math.min(1,Math.max(0,(d-9)/8));
    if(fbm(tx/13,ty/13,seed+101)<.04+.23*ramp)return 2;
    if(fbm(tx/8,ty/8,seed+202)>1-.27*ramp)return 1;
    return 0;
  }
  function propSpec(tx,ty,a=arenaOf()){
    if(terrainRaw(tx,ty,a)!==0||Math.hypot(tx,ty)<7)return null;
    let open=true;
    for(let b=-1;b<=1&&open;b++)for(let c=-1;c<=1;c++)if(terrainRaw(tx+c,ty+b,a)!==0){open=false;break;}
    if(a&&arenaDist(a,tx,ty)<a.r+9)return null; // arena decoration only: trees/rocks/grass
    const h=H(tx,ty,seed+404),grove=fbm(tx/10,ty/10,seed+505)>.6,hs=H(tx,ty,seed+909);
    if(open&&Math.hypot(tx,ty)>12&&hs<.0032){const type=hs<.0004?'altar':hs<.0008?'spring':hs<.0011?'bigchest':'trap';return {type,kind:Math.floor(H(tx,ty,seed+910)*(type==='altar'?4:3))};}
    if(open&&h<(grove?.07:.006))return {type:'tree',kind:0};
    if(open&&h>.992)return {type:'rock',kind:0};
    if(open&&h>.985&&h<=.992&&H(tx,ty,seed+606)<.07)return {type:'chest',kind:0};
    return null; // grass is never drawn on the map
  }
  // 1.3.5 briefly forced predictions off; turn the full map back on once.
  try{if(!localStorage.getItem('ps.mapPredictRestored')){G.Settings.set('mapPredict',true);localStorage.setItem('ps.mapPredictRestored','1');}}catch(_){}
  world.mapPredictTerrain=terrainRaw;world.mapPredictProp=propSpec;
  const visible=world.visibleProps;
  world.visibleProps=function(cam){
    const result=visible.apply(this,arguments);
    if(game.player&&['playing','paused','held'].includes(game.state)&&performance.now()-sampledAt>300){
      sampledAt=performance.now();
      const x0=Math.floor(cam.left()/32),y0=Math.floor(cam.top()/32);
      const x1=Math.ceil((cam.left()+cam.w)/32),y1=Math.ceil((cam.top()+cam.h)/32);
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)terrain.set(x,y,1+(({floor:0,wall:1,liquid:2})[world.kindAt(x*32+16,y*32+16)]??3));
      const alive=new Set();
      for(const p of result)if(p.hp>0&&!p.used&&p.type!=='grass')alive.add(tileKey(p.tx,p.ty));
      // Anything inside the fully visible view that is not alive was broken or used.
      for(let y=y0+1;y<y1-1;y++)for(let x=x0+1;x<x1-1;x++){const key=tileKey(x,y);if(!alive.has(key)&&(props.has(key)||propSpec(x,y))){props.delete(key);gone.add(key);}}
      for(const p of result){
        if(p.hp<=0||p.used||p.type==='grass')continue;
        const key=tileKey(p.tx,p.ty);gone.delete(key);
        props.set(key,{type:p.type,tx:p.tx,ty:p.ty,x:p.x,y:p.y,charge:p.charge,predicted:false});
      }
      while(props.size>12000)props.delete(props.keys().next().value);
      while(gone.size>20000)gone.delete(gone.values().next().value);
    }
    return result;
  };
  world.mapSample=function(tx0,ty0,cols,rows,predict=true){
    cols=Math.max(1,Math.min(160,cols|0));rows=Math.max(1,Math.min(160,rows|0));
    const values=new Uint8Array(cols*rows).fill(3),found=[],a=arenaOf();
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const tx=tx0+x,ty=ty0+y,seen=terrain.get(tx,ty);
      if(seen&&!predict){values[y*cols+x]=seen-1;continue;}
      if(!predict)continue;
      const key=tileKey(tx,ty);let v=predicted.get(tx,ty);
      if(!v){
        const spec=propSpec(tx,ty,a);v=1+terrainRaw(tx,ty,a)+(spec?4:0);
        if(spec){if(specs.size>=20000)clearPredicted();specs.set(key,spec);}
        predicted.set(tx,ty,v);
      }
      values[y*cols+x]=seen?seen-1:(v-1)&3;
      if(v&4&&!props.has(key)&&!gone.has(key)){const spec=specs.get(key)||propSpec(tx,ty,a);if(spec)found.push({...spec,tx,ty,predicted:true});}
    }
    for(const p of props.values())if(p.tx>=tx0&&p.tx<tx0+cols&&p.ty>=ty0&&p.ty<ty0+rows)found.push({...p});
    return {terrain:values,props:found,tx0,ty0,cols,rows,seed};
  };
  // Current official Touch supports user-configurable button positions. Keep it.
  const originalSafe=G.Touch.safeArea;
  G.Touch.safeArea=function(){
    const safe={...originalSafe.call(this)};
    try{const v=window.AndroidApp?.getCutoutInsets?.().split(',').map(Number);
      if(v?.length===5&&v.every(Number.isFinite)&&v[4]>0)for(const [i,key] of ['left','top','right','bottom'].entries())safe[key]=Math.max(safe[key],Math.min((i%2?innerHeight:innerWidth)/2,Math.max(0,v[i])/v[4]));
    }catch(_){}
    for(const key of ['left','top','right','bottom'])document.documentElement.style.setProperty('--ps-safe-'+key,safe[key]+'px');
    // Measured height: older WebViews lack dvh units.
    document.documentElement.style.setProperty('--ps-vh',innerHeight+'px');
    return safe;
  };
  G.Touch.safeArea();setInterval(()=>G.Touch.safeArea(),500);
  if(!G.Input.reset)G.Input.reset=function(){dispatchEvent(new Event('blur'));G.Input.endFrame();};
  game.pauseForMap=function(){
    const token={coop:G.Coop.active,resume:game.state==='playing'};
    G.Input.reset();G.Touch.reset();
    if(token.coop)G.Coop.holdStart();
    else if(token.resume){game.togglePause();G.UI.hide('scr-pause');}
    return token;
  };
  game.resumeFromMap=function(token){
    G.Input.reset();G.Touch.reset();
    if(token?.coop){G.Coop.holdEnd();return;}
    if(token?.resume&&game.state==='paused')game.togglePause();
  };
  const draw=hud.draw;
  hud.draw=function(ctx,w,h,player,...args){
    const result=draw.call(this,ctx,w,h,player,...args);
    if(player&&!G.Judgment?.cinematic)G.MapUI.drawHUD(ctx,w,h,player);
    return result;
  };
})();
