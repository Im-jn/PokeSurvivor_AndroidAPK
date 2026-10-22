/* ============ news-ui.js — "Novedades" ============
 * Botón en la barra de arriba que abre la lista de cambios del juego
 * (js/data/changelog.js). Lleva un punto mientras haya algo que no has visto.
 */
G.NewsUI = (() => {
  const $ = G.UI.$;
  const KEY = 'ps.news.seen';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const latest = () => (G.CHANGELOG[0] || {}).d || '';
  let generation=0,observer=null,removeScroll=null;
  function seen() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }

  function init() {
    const b = $('btn-news');
    b.innerHTML = G.Icons.html('book', 18) + ' <span>Novedades</span><i class="dot"></i>';
    b.onclick = open;
    $('news-close').onclick = close;
    refresh();
  }
  function refresh() { $('btn-news').classList.toggle('new', seen() < latest()); }

  function fmt(d) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString(G.I18n.lang === 'en' ? 'en-GB' : G.I18n.lang === 'zh' ? 'zh-CN' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function open() {
    observer?.disconnect();removeScroll?.();const ticket=++generation;
    const en = G.I18n.lang === 'es' ? 0 : 1;
    const zh=G.I18n.lang==='zh',jobs=[];
    const PARTS = [['new', ['Nuevo', 'New','新增']], ['chg', ['Cambios', 'Changes','调整']], ['fix', ['Arreglos', 'Fixes','修复']]];
    function text(pair){
      const source=typeof pair==='string'?pair:(pair?.[en]||pair?.[0]||'');
      if(!zh||!source)return esc(source);
      const id=jobs.length,result=G.NewsTranslate.cached(source);jobs.push({source,result,id});
      return '<span data-news-translation="'+id+'">'+esc(result||source)+'</span>';
    }
    $('news-body').innerHTML = G.CHANGELOG.map(v =>
      `<div class="news-day" translate="no"><h3>${text(v.title)}<small>${fmt(v.d)}</small></h3>` +
      PARTS.filter(([k]) => v[k] && v[k].length).map(([k, lbl]) =>
        `<div class="news-part"><span class="news-tag ${k}">${lbl[zh?2:en]}</span><ul>${v[k].map(t => `<li>${text(t)}</li>`).join('')}</ul></div>`).join('') +
      '</div>').join('');
    $('news-body').scrollTop = 0;
    $('scr-news').classList.remove('hidden');
    try { localStorage.setItem(KEY, latest()); } catch (e) { /* nada */ }
    refresh();
    document.getElementById('news-translation-tools')?.remove();
    if(zh)translateVisible(jobs,ticket);
  }
  function translateVisible(jobs,ticket){
    const bar=document.createElement('div');bar.id='news-translation-tools';bar.className='row news-translation-tools';
    bar.innerHTML='<span class="grow note" id="news-translation-status"></span><button class="btn small ghost" id="news-original-toggle">查看原文</button><button class="btn small ghost hidden" id="news-translation-retry">重试翻译</button>';
    $('news-body').before(bar);
    let original=false,paused=false,active=0,reason='';const queue=[];
    const status=bar.querySelector('#news-translation-status'),toggle=bar.querySelector('#news-original-toggle'),retry=bar.querySelector('#news-translation-retry');
    function update(){
      if(ticket!==generation)return;
      const done=jobs.filter(j=>j.result).length;
      status.textContent=original?'正在显示更新原文':paused?reason:active?'正在自动翻译更新内容…':'自动翻译 · MyMemory · 已翻译 '+done+' 段，滚动继续';
      retry.classList.toggle('hidden',!paused);
    }
    function drain(){
      if(ticket!==generation||original||paused)return;
      while(active<2&&queue.length){
        const job=queue.shift();active++;
        G.NewsTranslate.translate(job.source).then(result=>{
          job.result=result;
          if(ticket===generation&&!original)job.node.textContent=result;
        }).catch(error=>{paused=true;job.queued=false;reason=/QUOTA|HTTP_429/.test(String(error))?'翻译服务额度暂时用完，未译部分保留原文':'翻译连接失败，未译部分保留原文';}).finally(()=>{active--;update();drain();});
      }
      update();
    }
    function enqueue(job){if(!job.result&&!job.queued){job.queued=true;queue.push(job);}drain();}
    for(const job of jobs)job.node=$('news-body').querySelector('[data-news-translation="'+job.id+'"]');
    if(typeof IntersectionObserver==='function'){
      observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)enqueue(jobs[Number(e.target.dataset.newsTranslation)]);},{root:$('news-body'),rootMargin:'100px'});
      for(const job of jobs)if(!job.result)observer.observe(job.node);
    }else{
      const check=()=>{const root=$('news-body').getBoundingClientRect();for(const job of jobs){const r=job.node.getBoundingClientRect();if(r.bottom>root.top-100&&r.top<root.bottom+100)enqueue(job);}};
      $('news-body').addEventListener('scroll',check,{passive:true});removeScroll=()=>$('news-body').removeEventListener('scroll',check);check();
    }
    toggle.onclick=()=>{original=!original;toggle.textContent=original?'显示中文':'查看原文';for(const job of jobs)job.node.textContent=original?job.source:(job.result||job.source);update();drain();};
    retry.onclick=()=>{paused=false;for(const job of jobs)if(!job.result&&!job.queued&&job.node.getBoundingClientRect().top<$('news-body').getBoundingClientRect().bottom+100)enqueue(job);drain();};
    update();
  }
  function close() { ++generation;observer?.disconnect();removeScroll?.();$('scr-news').classList.add('hidden'); }

  return { init, open, close };
})();
