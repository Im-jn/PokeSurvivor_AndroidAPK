.class public Lcom/john/pokesurvivor/LocalWebAssets;
.super Ljava/lang/Object;


# direct methods
.method public static open(Landroid/content/Context;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    .locals 6

    if-eqz p1, :cond_7

    invoke-virtual {p1}, Landroid/net/Uri;->getScheme()Ljava/lang/String;

    move-result-object v0

    const-string v1, "https"

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_7

    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object v1

    const-string v2, "www.gstatic.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_0

    const-string v2, "/firebasejs/13.0.0/firebase-app-compat.js"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_0

    const-string v2, "www/vendor/firebase/firebase-app-compat.js"

    const-string v3, "application/javascript"

    goto/16 :goto_0

    :cond_0
    const-string v2, "www.gstatic.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_1

    const-string v2, "/firebasejs/13.0.0/firebase-auth-compat.js"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_1

    const-string v2, "www/vendor/firebase/firebase-auth-compat.js"

    const-string v3, "application/javascript"

    goto :goto_0

    :cond_1
    const-string v2, "www.gstatic.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_2

    const-string v2, "/firebasejs/13.0.0/firebase-firestore-compat.js"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_2

    const-string v2, "www/vendor/firebase/firebase-firestore-compat.js"

    const-string v3, "application/javascript"

    goto :goto_0

    :cond_2
    const-string v2, "www.gstatic.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_3

    const-string v2, "/firebasejs/13.0.0/firebase-database-compat.js"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_3

    const-string v2, "www/vendor/firebase/firebase-database-compat.js"

    const-string v3, "application/javascript"

    goto :goto_0

    :cond_3
    const-string v2, "pokesurvivor.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_4

    const-string v2, "/assets/fonts/PixelifyPS-400.ttf"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_4

    const-string v2, "www/assets/fonts/PixelifyPS-400.ttf"

    const-string v3, "font/ttf"

    goto :goto_0

    :cond_4
    const-string v2, "pokesurvivor.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_5

    const-string v2, "/assets/fonts/PixelifyPS-700.ttf"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_5

    const-string v2, "www/assets/fonts/PixelifyPS-700.ttf"

    const-string v3, "font/ttf"

    goto :goto_0

    :cond_5
    const-string v2, "pokesurvivor.com"

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_6

    const-string v2, "/assets/fonts/PixelifySans.ttf"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_6

    const-string v2, "www/assets/fonts/PixelifySans.ttf"

    const-string v3, "font/ttf"

    goto :goto_0

    :cond_6
    goto :goto_1

    :goto_0
    :try_start_0
    invoke-virtual {p0}, Landroid/content/Context;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v0

    invoke-virtual {v0, v2}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;

    move-result-object v4

    new-instance v2, Landroid/webkit/WebResourceResponse;

    const-string v5, "UTF-8"

    invoke-direct {v2, v3, v5, v4}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V

    return-object v2
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    move-exception v0

    :cond_7
    :goto_1
    const/4 v0, 0x0

    return-object v0
.end method
