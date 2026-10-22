const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(storage=new Map()){
 const c={G:{},TextEncoder,AbortController,setTimeout,clearTimeout,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
 vm.runInNewContext(fs.readFileSync('source/js/ui/news-translate.js','utf8'),c);return {translator:c.G.NewsTranslate,storage,context:c};
}
test('new release-note text is translated at runtime and unchanged text uses persisted cache',async()=>{
 const {translator,storage}=setup();let calls=0;
 translator.setProvider(async text=>{calls++;return text==='A new boss arrives'?'新增首领':'新的更新';});
 assert.equal(await translator.translate('A new boss arrives'),'新增首领');assert.equal(await translator.translate('A new boss arrives'),'新增首领');
 assert.equal(calls,1);const next=setup(storage);assert.equal(await next.translator.translate('A new boss arrives'),'新增首领');
 assert.equal(await translator.translate('Tomorrow brings a new mode'),'新的更新');assert.equal(calls,2);
});
test('duplicate concurrent requests share work without submitting extra data',async()=>{
 const {translator}=setup();let calls=0,release;
 translator.setProvider((text,options)=>{calls++;assert.equal(text,'Public release note');assert(options.signal);return new Promise(resolve=>release=resolve);});
 const a=translator.translate('Public release note'),b=translator.translate('Public release note');await Promise.resolve();release('公开更新内容');
 assert.equal(await a,'公开更新内容');assert.equal(await b,'公开更新内容');assert.equal(calls,1);
});
test('failed translation keeps source available and can be retried',async()=>{
 const {translator}=setup();translator.setProvider(null);await assert.rejects(translator.translate('New content'),/UNCONFIGURED/);
 translator.setProvider(async()=>{throw new Error('network');});await assert.rejects(translator.translate('New content'),/network/);
 translator.setProvider(async()=> '新内容');assert.equal(await translator.translate('New content'),'新内容');
});
test('stalled and invalid translations do not poison the cache',async()=>{
 const {translator}=setup();translator.setProvider(()=>new Promise(()=>{}));await assert.rejects(translator.translate('New content',{timeout:10}),/TIMEOUT/);
 assert.equal(translator.cached('New content'),undefined);translator.setProvider(async()=> 'still English');await assert.rejects(translator.translate('New content'),/INVALID/);
});
test('public provider splits UTF-8 text, omits credentials and recognizes quota errors',async()=>{
 const {translator,context}=setup();let requests=0;
 context.fetch=async(url,options)=>{const u=new URL(url);assert.equal(u.hostname,'api.mymemory.translated.net');assert.equal(u.searchParams.get('langpair'),'en|zh-CN');assert(new TextEncoder().encode(u.searchParams.get('q')).length<=480);assert.equal(options.credentials,'omit');requests++;return {ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:'中文 &#x66F4;&#x65B0;'}})};};
 assert.match(await translator.translate('Pokémon update. '.repeat(80)),/中文 更新/);assert(requests>1);
 context.fetch=async()=>({ok:true,json:async()=>({responseStatus:429,quotaFinished:true})});await assert.rejects(translator.translate('New public note'),/QUOTA/);
});
