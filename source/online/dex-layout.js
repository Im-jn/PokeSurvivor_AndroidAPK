// Pokédex on landscape phones: rarity filters and sorting collapse behind a
// "Filter" button next to the search box, so the Pokémon grid gets the space.
(() => {
  const LABEL={zh:'筛选',en:'Filter',es:'Filtros'};
  let open=false;
  function active(){
    const filters=[...document.querySelectorAll('#dex-filters .chip.on')].filter((c,i,all)=>c!==document.querySelector('#dex-filters .chip'));
    const sortFirst=document.querySelector('#dex-sort .chip');
    const sortOn=document.querySelector('#dex-sort .chip.on');
    return filters.length+(sortOn&&sortOn!==sortFirst?1:0);
  }
  function sync(){
    const tools=document.querySelector('#scr-dex .dex-tools');
    if(!tools)return;
    let button=document.getElementById('ps-dex-filter');
    if(!button){
      button=document.createElement('button');button.id='ps-dex-filter';button.type='button';button.className='btn small ghost';button.setAttribute('translate','no');
      button.onclick=()=>{open=!open;sync();};
      const type=document.getElementById('dex-type');(type||tools.lastElementChild).after(button);
    }
    const n=active();
    // Only write on change: this runs from a MutationObserver on the same subtree.
    const lang=String(G.I18n?.lang||''),text=(/^zh/.test(lang)?LABEL.zh:lang==='es'?LABEL.es:LABEL.en)+(n?' · '+n:'')+(open?' ▴':' ▾');
    if(button.textContent!==text)button.textContent=text;
    if(button.classList.contains('gold')!==n>0){button.classList.toggle('gold',n>0);button.classList.toggle('ghost',!n);}
    const screen=document.getElementById('scr-dex');
    if(screen.classList.contains('ps-dex-open')!==open)screen.classList.toggle('ps-dex-open',open);
  }
  const screen=document.getElementById('scr-dex');
  if(!screen)return;
  new MutationObserver(sync).observe(screen,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  sync();
})();
