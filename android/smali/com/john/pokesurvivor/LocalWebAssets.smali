.class public Lcom/john/pokesurvivor/LocalWebAssets;
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
    
    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v1
    const-string v2, "/js/app.min.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v1
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "9c81bc64df"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v1
    const-string v2, "__ps_original"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "1"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v1
    const-string v2, "www/vendor/official/app.min.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v1

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v2
    const-string v2, "/css/style.css"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v2
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "7ec35e9cc4"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v2
    const-string v2, "www/vendor/official/style.css"
    const-string v3, "text/css"
    goto :serve
    :asset_v2

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v3
    const-string v2, "/js/core/locales.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v3
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "23650f5e5d"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v3
    const-string v2, "www/vendor/official/js/core/locales.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v3

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v4
    const-string v2, "/js/lang/fr.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v4
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "23650f5e5d"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v4
    const-string v2, "www/vendor/official/js/lang/fr.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v4

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v5
    const-string v2, "/js/lang/it.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v5
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "23650f5e5d"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v5
    const-string v2, "www/vendor/official/js/lang/it.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v5

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v6
    const-string v2, "/js/lang/pt-BR.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v6
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "23650f5e5d"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v6
    const-string v2, "www/vendor/official/js/lang/pt-BR.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v6

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v7
    const-string v2, "/js/lang/zh-Hans.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v7
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "23650f5e5d"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v7
    const-string v2, "www/vendor/official/js/lang/zh-Hans.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v7

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v8
    const-string v2, "/js/lang/zh-Hant.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v8
    const-string v2, "v"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    const-string v2, "23650f5e5d"
    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_v8
    const-string v2, "www/vendor/official/js/lang/zh-Hant.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_v8

    const-string v2, "www.gstatic.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_9
    const-string v2, "/firebasejs/13.0.0/firebase-app-compat.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_9
    const-string v2, "www/vendor/firebase/firebase-app-compat.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_9

    const-string v2, "www.gstatic.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_10
    const-string v2, "/firebasejs/13.0.0/firebase-auth-compat.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_10
    const-string v2, "www/vendor/firebase/firebase-auth-compat.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_10

    const-string v2, "www.gstatic.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_11
    const-string v2, "/firebasejs/13.0.0/firebase-firestore-compat.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_11
    const-string v2, "www/vendor/firebase/firebase-firestore-compat.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_11

    const-string v2, "www.gstatic.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_12
    const-string v2, "/firebasejs/13.0.0/firebase-database-compat.js"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_12
    const-string v2, "www/vendor/firebase/firebase-database-compat.js"
    const-string v3, "application/javascript"
    goto :serve
    :asset_12

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_13
    const-string v2, "/assets/fonts/PixelifyPS-400.ttf"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_13
    const-string v2, "www/assets/fonts/PixelifyPS-400.ttf"
    const-string v3, "font/ttf"
    goto :serve
    :asset_13

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_14
    const-string v2, "/assets/fonts/PixelifyPS-700.ttf"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_14
    const-string v2, "www/assets/fonts/PixelifyPS-700.ttf"
    const-string v3, "font/ttf"
    goto :serve
    :asset_14

    const-string v2, "pokesurvivor.com"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_15
    const-string v2, "/assets/fonts/PixelifySans.ttf"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v5
    if-eqz v5, :asset_15
    const-string v2, "www/assets/fonts/PixelifySans.ttf"
    const-string v3, "font/ttf"
    goto :serve
    :asset_15

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
