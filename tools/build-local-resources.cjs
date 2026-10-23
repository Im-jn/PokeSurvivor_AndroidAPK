// Serve only these public, version-pinned static files from APK assets.
// API requests, tokens, credentials and cloud saves are never intercepted.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const resources={};
for(const name of ['app','auth','firestore','database']){
 const file=`vendor/firebase/firebase-${name}-compat.js`;
 resources[`https://www.gstatic.com/firebasejs/13.0.0/firebase-${name}-compat.js`]={file,mime:'application/javascript'};
}
for(const name of ['PixelifyPS-400.ttf','PixelifyPS-700.ttf','PixelifySans.ttf']){
 resources[`https://pokesurvivor.com/assets/fonts/${name}`]={file:`assets/fonts/${name}`,mime:'font/ttf'};
}
// Official game files bundled in the APK (source/vendor/official), served only
// when the page asks for the very same build (?v= fingerprint): the 1.9 MB
// client no longer has to come over a slow connection on every start. A newer
// official build has a new fingerprint and is downloaded as usual.
const official=fs.readFileSync(path.join(root,'source/vendor/official/index.html'),'utf8');
const ver=re=>(official.match(re)||[])[1];
const appV=ver(/js\/app\.min\.js\?v=([\w-]+)/),cssV=ver(/css\/style\.css\?v=([\w-]+)/),locV=ver(/js\/core\/locales\.js\?v=([\w-]+)/);
const versioned=[];
// js/official-app.js: the same build with the memory patches (build-current-offline.cjs).
if(appV)versioned.push({path:'/js/app.min.js',v:appV,need:'__ps_original',file:'js/official-app.js',mime:'application/javascript'});
if(cssV)versioned.push({path:'/css/style.css',v:cssV,file:'vendor/official/style.css',mime:'text/css'});
if(locV){
  versioned.push({path:'/js/core/locales.js',v:locV,file:'vendor/official/js/core/locales.js',mime:'application/javascript'});
  for(const f of fs.readdirSync(path.join(root,'source/vendor/official/js/lang')))versioned.push({path:'/js/lang/'+f,v:locV,file:'vendor/official/js/lang/'+f,mime:'application/javascript'});
}
let cases='';let index=0;
for(const item of versioned){
  const buffer=fs.readFileSync(path.join(root,'source',item.file));
  resources['https://pokesurvivor.com'+item.path+'?v='+item.v]={file:item.file,mime:item.mime,versioned:true,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),bytes:buffer.length};
  const next='asset_v'+(++index);
  cases+=`
    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :${next}
    const-string v2, "${item.path}"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :${next}
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "${item.v}"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :${next}${item.need?`
    const-string v2, "${item.need}"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "1"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :${next}`:''}
    const-string v2, "www/${item.file}"
    const-string v3, "${item.mime}"
    goto :serve
    :${next}
`;
}
for(const [url,item] of Object.entries(resources)){
 if(item.versioned)continue;
 const u=new URL(url),buffer=fs.readFileSync(path.join(root,'source',item.file));
 item.sha256=crypto.createHash('sha256').update(buffer).digest('hex');item.bytes=buffer.length;
 const next='asset_'+(++index);
 cases+=`
    const-string v2, "${u.hostname}"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :${next}
    const-string v2, "${u.pathname}"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :${next}
    const-string v2, "www/${item.file}"
    const-string v3, "${item.mime}"
    goto :serve
    :${next}
`;
}
const smali=`.class public Lcom/john/pokesurvivor/LocalWebAssets;
.super Ljava/lang/Object;

.method public static open(Landroid/content/Context;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    .locals 6
    if-eqz p1, :miss
    invoke-virtual {p1}, Landroid/net/Uri;->getScheme()Ljava/lang/String;
    move-result-object v0
    const-string v1, "https"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :miss
    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;
    move-result-object v0
    invoke-virtual {p1}, Landroid/net/Uri;->getPath()Ljava/lang/String;
    move-result-object v1
    ${cases}
    goto :miss
    :serve
    :try_start
    invoke-virtual {p0}, Landroid/content/Context;->getAssets()Landroid/content/res/AssetManager;
    move-result-object v0
    invoke-virtual {v0, v2}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;
    move-result-object v4
    new-instance v2, Landroid/webkit/WebResourceResponse;
    const-string v5, "UTF-8"
    invoke-direct {v2, v3, v5, v4}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V
    return-object v2
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :failed
    :failed
    move-exception v0
    :miss
    const/4 v0, 0x0
    return-object v0
.end method
`;
fs.writeFileSync(path.join(root,'android/smali/com/john/pokesurvivor/LocalWebAssets.smali'),smali);
fs.writeFileSync(path.join(root,'source/online/local-resources.json'),JSON.stringify(resources,null,2)+'\n');
const client=path.join(root,'android/smali/com/john/pokesurvivor/OnlineWebViewClient.smali');
let s=fs.readFileSync(client,'utf8');
const signature='.method public shouldInterceptRequest(';
const begin=s.indexOf(signature),end=s.indexOf('.end method',begin);
let method=s.slice(begin,end);
if(!method.includes('LocalWebAssets;->open')){
 method=method.replace('    move-result-object v0',`    move-result-object v0
    iget-object v1, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    invoke-static {v1, v0}, Lcom/john/pokesurvivor/LocalWebAssets;->open(Landroid/content/Context;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    move-result-object v1
    if-eqz v1, :local_asset_miss
    return-object v1
    :local_asset_miss`);
 s=s.slice(0,begin)+method+s.slice(end);fs.writeFileSync(client,s);
}
console.log(`Bundled ${Object.keys(resources).length} exact HTTPS static resources; auth and save endpoints remain official`);
