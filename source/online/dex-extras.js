// Pokédex conveniences (move info popups: move-info.js):
//  - "Upgrades" button on an owned Pokémon's page, opening the Upgrades screen
//    on that Pokémon; the Upgrades screen gets a button back to its Pokédex
//    page (and its Back button returns there when it was opened from it).
(() => {
  const dexScreen=document.getElementById('scr-dex'),detail=document.getElementById('dex-detail'),upgScreen=document.getElementById('scr-upgrades');
  if(!dexScreen||!detail||!G.Moves)return;
  const TEXT={
    zh:{upgrades:'强化',toDex:'查看图鉴',notOwned:'还没有这只宝可梦，无法强化。'},
    en:{upgrades:'Upgrades',toDex:'View in Pokédex',notOwned:'You do not have this Pokémon yet.'},
    es:{upgrades:'Mejoras',toDex:'Ver en la Pokédex',notOwned:'Todavía no tienes este Pokémon.'}
  };
  const text=()=>{const l=String(G.I18n&&G.I18n.lang||'');return /^zh/.test(l)?TEXT.zh:l==='es'?TEXT.es:TEXT.en;};
  const T=(s,ns)=>{try{return G.T(s,ns);}catch(_){return s;}};

  // ---------- item pickers (Mint, Ability Capsule / Patch, TM) ----------
  // Tapping an item button in a Pokémon's page opens its choices at the end of
  // the page while the page jumps back to the top, so on a phone nothing seemed
  // to happen. Bring the choices into view.
  let wantPicker=0,lastExtra='';
  detail.addEventListener('click',event=>{const b=event.target.closest&&event.target.closest('[data-extra]');if(b){wantPicker=performance.now();lastExtra=b.dataset.extra;}},true);
  // Ability choices only show the ability's name: add what it does.
  function describeAbilities(picker){
    if(!/^cap/.test(lastExtra)||picker.dataset.psDescribed)return;
    const id=currentDex(),mon=G.DEX_BY&&G.DEX_BY[id];let slots;
    try{slots=G.Mons.slots(id);}catch(_){return;}
    if(!mon||!Array.isArray(slots))return;
    picker.dataset.psDescribed='1';picker.classList.add('ps-ability-picker');
    for(const chip of picker.querySelectorAll('.chip[data-v]')){
      const ability=slots[+chip.dataset.v];if(!ability)continue;
      let fx=null;try{fx=G.AbilityFX.of(ability,mon);}catch(_){}
      if(!fx||!fx.d)continue;
      const d=document.createElement('small');d.className='ps-ability-desc';
      d.textContent=T(fx.d)+(fx.d2?' '+T(fx.d2):'');
      chip.appendChild(d);
    }
  }
  new MutationObserver(()=>{
    if(!wantPicker||performance.now()-wantPicker>2000)return;
    const picker=detail.querySelector('.ban-picker');if(!picker)return;
    wantPicker=0;describeAbilities(picker);
    requestAnimationFrame(()=>{picker.scrollIntoView({block:'center',behavior:'smooth'});picker.classList.add('ps-flash');setTimeout(()=>picker.classList.remove('ps-flash'),1200);});
  }).observe(detail,{childList:true,subtree:true});

  // Ability Capsule / Patch only show up when the Pokémon has another ability
  // to switch to (153 Pokémon have just one). Say so instead of showing nothing.
  const NOTE={zh:'只有一种特性，不能更换',en:'Only one ability: cannot be changed',es:'Solo tiene una habilidad: no se puede cambiar'};
  function abilityNote(){
    const rows=detail.querySelectorAll('.mon-extra .mx-row');const row=rows[1];
    if(!row||row.querySelector('.ps-ability-note')||row.querySelector('[data-extra="cap"],[data-extra="caph"]'))return;
    const id=currentDex();
    try{
      if(!id||!G.Shop||(G.Shop.count('cap')+G.Shop.count('caph'))<=0||G.Mons.abilityChoices(id,true).length)return;
    }catch(_){return;}
    const l=String(G.I18n&&G.I18n.lang||''),note=document.createElement('small');
    note.className='ps-ability-note';note.setAttribute('translate','no');note.textContent=/^zh/.test(l)?NOTE.zh:l==='es'?NOTE.es:NOTE.en;
    row.appendChild(note);
  }
  new MutationObserver(abilityNote).observe(detail,{childList:true,subtree:true});

  // ---------- Pokédex <-> Upgrades ----------
  const currentDex=()=>{const head=detail.querySelector('.center');const m=head&&head.textContent.match(/\b(\d{3,4})\b/);return m?+m[1]:0;};
  const owned=id=>{try{return !!G.DB.owns(id);}catch(_){return false;}};
  const back=screen=>{if(!screen||screen.classList.contains('hidden'))return;const b=screen.querySelector('[data-back]');if(b)b.click();};
  const menuGo=go=>{const b=document.querySelector('#scr-menu [data-go="'+go+'"]');if(b)b.click();};
  let fromDex=0;
  function openUpgrades(id){
    if(!owned(id)){try{G.UI.toast(text().notOwned,2500);}catch(_){}return;}
    fromDex=id;back(dexScreen);menuGo('upgrades');
    const select=document.getElementById('upg-mon');
    if(select&&[...select.options].some(o=>+o.value===id)){select.value=String(id);select.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function openDex(id){
    back(upgScreen);menuGo('dex');
    const find=()=>[...document.querySelectorAll('#dex-grid > .cell')].find(c=>{const n=c.querySelector('.no');return n&&+n.textContent===id;});
    let cell=find();
    if(!cell){const all=document.querySelector('#dex-gens .gen-tab');if(all){all.click();cell=find();}}
    if(!cell){const q=document.getElementById('dex-q');if(q){q.value=String(id);q.dispatchEvent(new Event('input',{bubbles:true}));cell=find();}}
    if(cell){cell.click();cell.scrollIntoView({block:'nearest'});}
  }
  function addUpgradesButton(){
    const action=detail.querySelector('.ps-dex-action')||detail;
    const id=currentDex();
    let button=document.getElementById('ps-dex-upgrades');
    if(!id||!owned(id)){if(button)button.remove();return;}
    if(!button){button=document.createElement('button');button.id='ps-dex-upgrades';button.type='button';button.className='btn grow';button.setAttribute('translate','no');
      button.addEventListener('click',()=>openUpgrades(currentDex()));}
    button.textContent=text().upgrades;
    if(button.parentNode!==action)action.appendChild(button);
  }
  new MutationObserver(()=>{if(!document.getElementById('ps-dex-upgrades')||document.getElementById('ps-dex-upgrades').parentNode!==(detail.querySelector('.ps-dex-action')||detail))addUpgradesButton();}).observe(detail,{childList:true,subtree:true});
  addUpgradesButton();

  if(upgScreen){
    const row=upgScreen.querySelector('#upg-mon')&&upgScreen.querySelector('#upg-mon').parentNode;
    if(row&&!document.getElementById('ps-upg-dex')){
      const b=document.createElement('button');b.id='ps-upg-dex';b.type='button';b.className='btn small';b.setAttribute('translate','no');b.textContent=text().toDex;
      b.addEventListener('click',()=>{const v=+document.getElementById('upg-mon').value;fromDex=0;openDex(v);});
      row.appendChild(b);
      new MutationObserver(()=>{b.textContent=text().toDex;}).observe(upgScreen,{attributes:true,attributeFilter:['class']});
    }
    // Back from an Upgrades screen opened in the Pokédex: return there.
    upgScreen.addEventListener('click',event=>{
      if(!fromDex||!event.target.closest('[data-back]'))return;
      const v=+document.getElementById('upg-mon').value||fromDex;fromDex=0;
      setTimeout(()=>{if(document.querySelector('#scr-menu:not(.hidden)'))openDex(v);},0);
    });
  }
  G.DexExtras={openUpgrades,openDex,currentDex};
})();
