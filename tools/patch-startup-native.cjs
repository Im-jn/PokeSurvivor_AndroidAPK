const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../android/smali/com/john/pokesurvivor');
function edit(name,fn){const p=path.join(dir,name+'.smali');fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('MainActivity',s=>{
 if(!s.includes('.field public volatile onlineReady:Z'))s=s.replace('.super Landroid/app/Activity;','.super Landroid/app/Activity;\n.field public volatile onlineReady:Z');
 // Service-worker requests bypass WebViewClient; give them the same interceptor.
 if(!s.includes('OnlineServiceWorkerClient'))s=s.replace('    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V',`    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V
    :sw_try_start
    invoke-static {}, Landroid/webkit/ServiceWorkerController;->getInstance()Landroid/webkit/ServiceWorkerController;
    move-result-object v0
    new-instance v2, Lcom/john/pokesurvivor/OnlineServiceWorkerClient;
    invoke-direct {v2, v1}, Lcom/john/pokesurvivor/OnlineServiceWorkerClient;-><init>(Lcom/john/pokesurvivor/OnlineWebViewClient;)V
    invoke-virtual {v0, v2}, Landroid/webkit/ServiceWorkerController;->setServiceWorkerClient(Landroid/webkit/ServiceWorkerClient;)V
    :sw_try_end
    .catch Ljava/lang/Exception; {:sw_try_start .. :sw_try_end} :sw_failed
    goto :sw_done
    :sw_failed
    move-exception v0
    :sw_done`);
 if(!s.includes('OnlineServiceWorkerClient'))throw Error('MainActivity: setWebViewClient call not found');
 return s.replaceAll('new-instance v1, Landroid/webkit/WebChromeClient;','new-instance v1, Lcom/john/pokesurvivor/StartupChromeClient;').replaceAll('invoke-direct {v1}, Landroid/webkit/WebChromeClient;-><init>()V','invoke-direct {v1}, Lcom/john/pokesurvivor/StartupChromeClient;-><init>()V');
});
edit('MainActivity',s=>{
 s=s.replace(/\.method public openAppPage\(Ljava\/lang\/String;\)V[\s\S]*?\.end method/,`.method public openAppPage(Ljava/lang/String;)V
    .locals 5
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :done
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    if-eqz p1, :done
    const-string v1, "https:"
    invoke-virtual {p1, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :done
    invoke-virtual {v0}, Landroid/webkit/WebView;->getWebViewClient()Landroid/webkit/WebViewClient;
    move-result-object v1
    instance-of v2, v1, Lcom/john/pokesurvivor/OnlineWebViewClient;
    if-eqz v2, :done
    check-cast v1, Lcom/john/pokesurvivor/OnlineWebViewClient;
    new-instance v2, Lcom/john/pokesurvivor/StartupTimeout;
    iget v3, v1, Lcom/john/pokesurvivor/OnlineWebViewClient;->generation:I
    invoke-direct {v2, v1, v0, v3}, Lcom/john/pokesurvivor/StartupTimeout;-><init>(Lcom/john/pokesurvivor/OnlineWebViewClient;Landroid/webkit/WebView;I)V
    const-wide/16 v3, 0x61a8
    invoke-virtual {v0, v2, v3, v4}, Landroid/webkit/WebView;->postDelayed(Ljava/lang/Runnable;J)Z
    :done
    return-void
.end method`);
 // The first page load goes through openAppPage too, so it gets the deadline.
 s=s.replace('    const-string v0, "https://pokesurvivor.com/"\n\n    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V','    const-string v0, "https://pokesurvivor.com/"\n\n    invoke-virtual {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->openAppPage(Ljava/lang/String;)V');
 if(!s.includes('const-wide/16 v3, 0x61a8')||!s.includes('invoke-virtual {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->openAppPage'))throw Error('MainActivity launch deadline not applied');
 return s;
});
edit('MainActivity$1',s=>s.includes('.method public startupReady()')?s:s+`
.method public startupReady()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;
    const/4 v1, 0x1
    iput-boolean v1, v0, Lcom/john/pokesurvivor/MainActivity;->onlineReady:Z
    return-void
.end method
`);
edit('OnlineWebViewClient',s=>{
 s=s.replace('.field private activity:', '.field public activity:');
 if(!s.includes('.field public generation:I'))s=s.replace('.super Landroid/webkit/WebViewClient;','.super Landroid/webkit/WebViewClient;\n.field public generation:I');
 s=s.replace('file:///android_asset/www/online-offline.html','file:///android_asset/www/index.html?offline&auto=network');
 s=s.replace(/\.method public onPageFinished\([\s\S]*?\.end method/,`
.method public onPageFinished(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 2
    new-instance v0, Lcom/john/pokesurvivor/StartupChromeClient;
    invoke-direct {v0}, Lcom/john/pokesurvivor/StartupChromeClient;-><init>()V
    const/16 v1, 0x64
    invoke-virtual {v0, p1, v1}, Lcom/john/pokesurvivor/StartupChromeClient;->onProgressChanged(Landroid/webkit/WebView;I)V
    return-void
.end method`);
 if(!s.includes('.method public onPageStarted('))s+=`
.method public onPageStarted(Landroid/webkit/WebView;Ljava/lang/String;Landroid/graphics/Bitmap;)V
    .locals 5
    iget v0, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->generation:I
    add-int/lit8 v0, v0, 0x1
    iput v0, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->generation:I
    iget-object v1, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    const/4 v2, 0x0
    iput-boolean v2, v1, Lcom/john/pokesurvivor/MainActivity;->onlineReady:Z
    invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v1
    invoke-static {v1}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v1
    if-eqz v1, :done
    new-instance v1, Lcom/john/pokesurvivor/StartupTimeout;
    invoke-direct {v1, p0, p1, v0}, Lcom/john/pokesurvivor/StartupTimeout;-><init>(Lcom/john/pokesurvivor/OnlineWebViewClient;Landroid/webkit/WebView;I)V
    const-wide/32 v2, 0xafc8
    invoke-virtual {p1, v1, v2, v3}, Landroid/webkit/WebView;->postDelayed(Ljava/lang/Runnable;J)Z
    :done
    return-void
.end method

.method public onReceivedHttpError(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;Landroid/webkit/WebResourceResponse;)V
    .locals 2
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->isForMainFrame()Z
    move-result v0
    if-eqz v0, :done
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    invoke-static {v0}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v0
    if-eqz v0, :done
    const-string v0, "file:///android_asset/www/index.html?offline&auto=http"
    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :done
    return-void
.end method
`;
 s=s.replace(/\.method public shouldInterceptRequest\([\s\S]*?\.end method/,fs.readFileSync(path.resolve(__dirname,'../native/OnlineScriptInterceptor.smali'),'utf8'));
 // Ignore late errors from an online navigation already replaced by local mode.
 for(const name of ['onReceivedError','onReceivedHttpError']){
  const re=new RegExp('\\.method public '+name+'\\([\\s\\S]*?\\.end method');
  s=s.replace(re,method=>method.includes('WebView;->getUrl()')?method:method.replace('.locals 2',`.locals 2
    invoke-virtual {p1}, Landroid/webkit/WebView;->getUrl()Ljava/lang/String;
    move-result-object v0
    if-eqz v0, :done
    invoke-static {v0}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v0
    invoke-static {v0}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v0
    if-eqz v0, :done`));
 }
 return s;
});
console.log('WebView main-script loader, HTTP/network fallback and generation-scoped 45s startup watchdog ready');
