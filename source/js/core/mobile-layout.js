// Reserve the real header height after translation, resize and cutout updates.
(() => {
  if(location.protocol==='file:')document.documentElement.classList.add('ps-offline');
  const bar=document.getElementById('topbar');
  if(!bar)return;
  let frame=0;
  function update(){
    frame=0;
    const bottom=bar.classList.contains('hidden')?0:Math.ceil(bar.getBoundingClientRect().bottom);
    document.documentElement.style.setProperty('--ps-chrome-bottom',bottom+'px');
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(bar);
  new MutationObserver(schedule).observe(bar,{attributes:true,attributeFilter:['class','style'],subtree:true,childList:true,characterData:true});
  addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  // Keep the partner action outside the scrolling detail, without replacing
  // official nodes or their event handlers when a Pokemon is selected.
  const detail=document.getElementById('dex-detail');
  function arrangeDetail(){
    if(!detail||detail.querySelector(':scope > .ps-dex-content')||!detail.firstChild)return;
    const content=document.createElement('div');content.className='ps-dex-content';
    const action=document.createElement('div');action.className='ps-dex-action';
    for(const node of [...detail.childNodes]){
      if(node.nodeType===1&&node.matches('button.btn'))action.appendChild(node);
      else content.appendChild(node);
    }
    detail.append(content,action);
  }
  if(detail){new MutationObserver(arrangeDetail).observe(detail,{childList:true});arrangeDetail();}
  schedule();
})();
