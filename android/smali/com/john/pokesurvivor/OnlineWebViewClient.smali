.class public Lcom/john/pokesurvivor/OnlineWebViewClient;
.super Landroid/webkit/WebViewClient;
.field public generation:I

.field public activity:Lcom/john/pokesurvivor/MainActivity;

.method public constructor <init>(Lcom/john/pokesurvivor/MainActivity;)V
    .locals 0
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
    iput-object p1, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    return-void
.end method

.method private static official(Landroid/net/Uri;)Z
    .locals 2
    if-eqz p0, :no
    invoke-virtual {p0}, Landroid/net/Uri;->getScheme()Ljava/lang/String;
    move-result-object v0
    const-string v1, "https"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :no
    invoke-virtual {p0}, Landroid/net/Uri;->getHost()Ljava/lang/String;
    move-result-object v0
    const-string v1, "pokesurvivor.com"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    return v0
    :no
    const/4 v0, 0x0
    return v0
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
    .locals 3
    if-eqz p2, :blocked
    const-string v0, "file:///android_asset/www/"
    invoke-virtual {p2, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v0
    if-nez v0, :internal
    const-string v0, "about:blank"
    invoke-virtual {v0, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-nez v0, :internal
    invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v1
    invoke-static {v1}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v0
    if-nez v0, :internal
    :try_start
    new-instance v0, Landroid/content/Intent;
    const-string v2, "android.intent.action.VIEW"
    invoke-direct {v0, v2, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V
    iget-object v1, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    invoke-virtual {v1, v0}, Lcom/john/pokesurvivor/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :failed
    goto :blocked
    :failed
    move-exception v0
    :blocked
    const/4 v0, 0x1
    return v0
    :internal
    const/4 v0, 0x0
    return v0
.end method









.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 5
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    iget-object v1, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    invoke-static {v1, v0}, Lcom/john/pokesurvivor/LocalWebAssets;->open(Landroid/content/Context;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    move-result-object v1
    if-eqz v1, :local_asset_miss
    return-object v1
    :local_asset_miss
    invoke-static {v0}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v1
    if-eqz v1, :default
    invoke-virtual {v0}, Landroid/net/Uri;->getPath()Ljava/lang/String;
    move-result-object v1
    const-string v2, "/sw.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v2
    if-eqz v2, :not_sw
    const-string v1, "www/online/sw-reset.js"
    goto :serve
    :not_sw
    const-string v2, "/js/app.min.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-eqz v1, :default
    const-string v1, "__ps_original"
    invoke-virtual {v0, v1}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v1
    const-string v2, "1"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-nez v1, :default
    const-string v1, "www/online/client-loader.js"
    :serve
    :try_start
    iget-object v0, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    invoke-virtual {v0}, Lcom/john/pokesurvivor/MainActivity;->getAssets()Landroid/content/res/AssetManager;
    move-result-object v0
    invoke-virtual {v0, v1}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;
    move-result-object v0
    new-instance v1, Landroid/webkit/WebResourceResponse;
    const-string v2, "application/javascript"
    const-string v3, "UTF-8"
    invoke-direct {v1, v2, v3, v0}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V
    return-object v1
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :failed
    :failed
    move-exception v0
    :default
    const/4 v0, 0x0
    return-object v0
.end method

























.method public onReceivedError(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;Landroid/webkit/WebResourceError;)V
    .locals 2
    invoke-virtual {p1}, Landroid/webkit/WebView;->getUrl()Ljava/lang/String;
    move-result-object v0
    if-eqz v0, :done
    invoke-static {v0}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v0
    invoke-static {v0}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v0
    if-eqz v0, :done
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->isForMainFrame()Z
    move-result v0
    if-eqz v0, :done
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    invoke-static {v0}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v0
    if-eqz v0, :done
    const-string v0, "file:///android_asset/www/index.html?offline&auto=network"
    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :done
    return-void
.end method

































.method public onPageFinished(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 2
    new-instance v0, Lcom/john/pokesurvivor/StartupChromeClient;
    invoke-direct {v0}, Lcom/john/pokesurvivor/StartupChromeClient;-><init>()V
    const/16 v1, 0x64
    invoke-virtual {v0, p1, v1}, Lcom/john/pokesurvivor/StartupChromeClient;->onProgressChanged(Landroid/webkit/WebView;I)V
    return-void
.end method

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
    invoke-virtual {p1}, Landroid/webkit/WebView;->getUrl()Ljava/lang/String;
    move-result-object v0
    if-eqz v0, :done
    invoke-static {v0}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v0
    invoke-static {v0}, Lcom/john/pokesurvivor/OnlineWebViewClient;->official(Landroid/net/Uri;)Z
    move-result v0
    if-eqz v0, :done
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
