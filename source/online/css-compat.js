// Older Android System WebViews (common on phones without Google Play, e.g.
// Xiaomi Mi 9) ignore dvh units (Chrome < 108) and the inset shorthand
// (Chrome < 87). The official CSS caps dialogs with max-height: calc(100dvh…),
// so there they lose their height limit and spill off-screen without scrolling.
// Rewrite such declarations to supported equivalents and add them after the
// original sheets. Inside a WebView, vh equals the visible height.
const psCssCompat=(() => {
  const supports=(p,v)=>{try{return CSS.supports(p,v);}catch(_){return false;}};
  const needDvh=!supports('height','100dvh'), needInset=!supports('inset','0px');
  const needed=needDvh||needInset;
  function rewrite(text){
    if(needDvh)text=text.replace(/(\d*\.?\d+)(?:dvh|svh|lvh)\b/g,'$1vh').replace(/(\d*\.?\d+)(?:dvw|svw|lvw)\b/g,'$1vw');
    if(needInset)text=text.replace(/(^|[;{\s])inset\s*:\s*([^;}!]+)(!important)?/g,(m,pre,value,imp)=>{
      const v=value.trim().split(/\s+/),[t,r=t,b=t,l=r]=v,i=imp?' !important':'';
      return `${pre}top:${t}${i};right:${r}${i};bottom:${b}${i};left:${l}${i}`;
    });
    return text;
  }
  function load(url){
    return new Promise(resolve=>{
      try{const x=new XMLHttpRequest();x.open('GET',url);x.onload=()=>resolve(x.status===0||x.status===200?x.responseText:'');x.onerror=()=>resolve('');x.send();}
      catch(_){resolve('');}
    });
  }
  /** Rewrites our sheet in place; official same-origin sheets go just before it. */
  async function apply(ours){
    if(!needed)return;
    ours.textContent=rewrite(ours.textContent);
    const links=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(l=>{try{return new URL(l.href,location.href).origin===location.origin||location.protocol==='file:';}catch(_){return false;}});
    const texts=await Promise.all(links.map(l=>load(l.href)));
    // Inline styles resolve url() against the page, not the sheet: make them absolute.
    const absolute=(text,base)=>text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,(m,q,u)=>/^(data:|[a-z]+:|#)/i.test(u)?m:'url("'+new URL(u,base).href+'")');
    const css=texts.map((t,i)=>rewrite(absolute(t,links[i].href))).join('\n');
    if(!css.trim())return;
    const fixed=document.createElement('style');fixed.id='ps-css-compat';fixed.textContent=css;
    ours.parentNode.insertBefore(fixed,ours);
  }
  // Flex gap (Chrome < 84) cannot be rewritten; give the common rows margins.
  try{
    const probe=document.createElement('div');probe.style.cssText='display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
    probe.appendChild(document.createElement('div'));probe.appendChild(document.createElement('div'));document.body.appendChild(probe);
    const noGap=probe.scrollHeight!==1;probe.remove();
    if(noGap){
      document.documentElement.classList.add('ps-nogap');
      const s=document.createElement('style');s.id='ps-nogap';
      s.textContent='.ps-nogap .topbar>*,.ps-nogap .tabs>*,.ps-nogap .chips>*,.ps-nogap .row>*,.ps-nogap .seg>*,.ps-nogap #map-filters>*,.ps-nogap #map-options>*,.ps-nogap #ps-run-mode>*{margin:2px 3px}';
      document.head.appendChild(s);
    }
  }catch(_){}
  return {needed,rewrite,apply};
})();
