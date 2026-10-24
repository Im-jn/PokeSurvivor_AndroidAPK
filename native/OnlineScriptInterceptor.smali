.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 5
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    iget-object v1, p0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    invoke-static {v1, v0}, Lcom/john/pokesurvivor/OfficialCache;->open(Landroid/content/Context;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    move-result-object v1
    if-eqz v1, :official_cache_miss
    return-object v1
    :official_cache_miss
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
