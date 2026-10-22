// Run mode chosen in the main menu before a run starts.
// Arceus: official behaviour, Judgment of Arceus at minute 30.
// Endless: the Judgment never starts; rifts keep appearing after minute 28.
// In co-op the host decides, because only the host may start the Judgment.
(() => {
  const judgment=G.Judgment;
  if(!judgment||typeof judgment.update!=='function')return;
  const KEY='ps.runMode',officialAt=Number(judgment.AT)||1800;
  const TEXT={
    zh:{arceus:'阿尔宙斯模式',endless:'无尽模式',arceusSub:'第 30 分钟降临阿尔宙斯审判',endlessSub:'不触发阿尔宙斯，可一直玩下去',title:'开局模式（联机以房主为准）'},
    en:{arceus:'Arceus mode',endless:'Endless mode',arceusSub:'Judgment of Arceus at minute 30',endlessSub:'No Arceus, play as long as you last',title:'Run mode (host decides in co-op)'},
    es:{arceus:'Modo Arceus',endless:'Modo infinito',arceusSub:'Sentencia de Arceus en el minuto 30',endlessSub:'Sin Arceus, aguanta lo que puedas',title:'Modo de partida (en grupo decide el anfitrión)'}
  };
  const mode=()=>{try{return localStorage.getItem(KEY)==='endless'?'endless':'arceus';}catch(_){return 'arceus';}};
  const text=()=>{const l=String(G.I18n?.lang||'');return /^zh/.test(l)?TEXT.zh:l==='es'?TEXT.es:TEXT.en;};
  // Latched at run start: Game.startRun calls Judgment.reset before playing.
  let endless=false;
  const reset=judgment.reset;
  judgment.reset=function(...args){
    endless=mode()==='endless';
    judgment.AT=endless?Infinity:officialAt;
    return reset.apply(this,args);
  };
  const update=judgment.update;
  judgment.update=function(dt,player,time,...rest){
    if(endless&&!judgment.active&&!judgment.cinematic&&time>=officialAt-1)time=officialAt-1;
    return update.call(this,dt,player,time,...rest);
  };
  G.RunMode={get:mode,set(value){try{localStorage.setItem(KEY,value==='endless'?'endless':'arceus');}catch(_){}render();},get endless(){return endless;}};

  function render(){
    const play=document.querySelector('#scr-menu [data-go="play"]');
    if(!play)return;
    let box=document.getElementById('ps-run-mode');
    if(!box){
      box=document.createElement('div');box.id='ps-run-mode';box.setAttribute('translate','no');
      box.innerHTML='<button type="button" data-mode="arceus"></button><button type="button" data-mode="endless"></button>';
      box.addEventListener('click',event=>{
        const button=event.target.closest('button[data-mode]');if(!button)return;
        G.RunMode.set(button.dataset.mode);try{G.Audio.sfx('click');}catch(_){}
      });
      play.after(box);
    }
    const t=text(),current=mode();
    box.title=t.title;
    for(const button of box.querySelectorAll('button')){
      button.textContent=t[button.dataset.mode];
      button.classList.toggle('on',button.dataset.mode===current);
      button.setAttribute('aria-pressed',String(button.dataset.mode===current));
    }
    // Two-column phone menus: sit beside Play instead of adding a row.
    const list=play.parentElement;
    if(list)list.classList.toggle('ps-mode-side',getComputedStyle(list).display==='grid');
    let sub=play.querySelector('small');
    if(sub){sub.setAttribute('translate','no');sub.textContent=t[current+'Sub'];}
  }
  render();
  addEventListener('resize',()=>{if(document.getElementById('ps-run-mode'))render();});
  const menu=document.getElementById('scr-menu');
  if(menu)new MutationObserver(()=>{if(!menu.classList.contains('hidden'))render();}).observe(menu,{attributes:true,attributeFilter:['class']});
})();
