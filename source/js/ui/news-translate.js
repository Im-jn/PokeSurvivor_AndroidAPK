// News contains public release notes. The provider may be online or on-device;
// it receives only the current note strings, never account or save data.
G.NewsTranslate = (() => {
  const KEY='ps.news.zh.cache.v1',cache=new Map(),pending=new Map();
  let provider=publicProvider;
  function chunks(text,max=480){
    const encoder=new TextEncoder(),out=[];let part='';
    for(const word of text.match(/\S+\s*/g)||[]){
      if(encoder.encode(part+word).length<=max){part+=word;continue;}
      if(part.trim())out.push(part.trim());part='';
      for(const char of word){if(encoder.encode(part+char).length>max){out.push(part.trim());part='';}part+=char;}
    }
    if(part.trim())out.push(part.trim());return out;
  }
  function decode(text){return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(all,key)=>{
    const known={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};if(known[key])return known[key];
    const code=key[1]?.toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
    return code>0&&code<=0x10ffff?String.fromCodePoint(code):all;
  });}
  async function publicProvider(text,{signal}){
    const out=[];
    for(const part of chunks(text)){
      const url='https://api.mymemory.translated.net/get?langpair=en%7Czh-CN&q='+encodeURIComponent(part);
      const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error('NEWS_TRANSLATION_HTTP_'+response.status);
      const json=await response.json();
      if(json.quotaFinished||Number(json.responseStatus)===429)throw new Error('NEWS_TRANSLATION_QUOTA');
      if(Number(json.responseStatus)!==200||typeof json.responseData?.translatedText!=='string')throw new Error('NEWS_TRANSLATION_SERVICE');
      out.push(decode(json.responseData.translatedText));
    }
    return out.join('');
  }
  try{
    const rows=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(Array.isArray(rows))for(const row of rows)if(Array.isArray(row)&&typeof row[0]==='string'&&typeof row[1]==='string')cache.set(row[0],row[1]);
  }catch(_){}
  function persist(){
    while(cache.size>240)cache.delete(cache.keys().next().value);
    try{localStorage.setItem(KEY,JSON.stringify([...cache]));}catch(_){}
  }
  function setProvider(fn){provider=typeof fn==='function'?fn:null;}
  async function translate(text,{timeout=15000}={}){
    if(typeof text!=='string'||!text.trim())return text;
    if(cache.has(text))return cache.get(text);
    if(pending.has(text))return pending.get(text);
    if(!provider)throw new Error('NEWS_TRANSLATOR_UNCONFIGURED');
    const translateWith=provider;
    const controller=typeof AbortController==='function'?new AbortController():null;
    const task=(async()=>{
      let timer;
      try{
        const work=Promise.resolve().then(()=>translateWith(text,{signal:controller?.signal}));
        const limit=new Promise((_,reject)=>{timer=setTimeout(()=>{controller?.abort();reject(new Error('NEWS_TRANSLATION_TIMEOUT'));},timeout);});
        const result=await Promise.race([work,limit]);
        if(typeof result!=='string'||!result.trim()||!/[\u3400-\u9fff]/.test(result))throw new Error('NEWS_TRANSLATION_INVALID');
        cache.set(text,result.trim());persist();return result.trim();
      }finally{clearTimeout(timer);pending.delete(text);}
    })();
    pending.set(text,task);return task;
  }
  return {setProvider,translate,cached:text=>cache.get(text),get available(){return !!provider;}};
})();
