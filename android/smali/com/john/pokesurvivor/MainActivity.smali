.class public Lcom/john/pokesurvivor/MainActivity;
.super Landroid/app/Activity;
.field public volatile onlineReady:Z
.field public volatile startupProgressAt:J
.source "MainActivity.java"


# instance fields
.field private webView:Landroid/webkit/WebView;

.field private static lastRendererRestart:J

.field private appActive:Z


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 15
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method

.method private enterImmersive()V
    .locals 3
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I
    const/16 v1, 0x1c
    if-lt v0, v1, :cutout_done
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    invoke-virtual {v0}, Landroid/view/Window;->getAttributes()Landroid/view/WindowManager$LayoutParams;
    move-result-object v1
    const/4 v2, 0x1
    iput v2, v1, Landroid/view/WindowManager$LayoutParams;->layoutInDisplayCutoutMode:I
    invoke-virtual {v0, v1}, Landroid/view/Window;->setAttributes(Landroid/view/WindowManager$LayoutParams;)V
    :cutout_done
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    invoke-virtual {v0}, Landroid/view/Window;->getDecorView()Landroid/view/View;
    move-result-object v0
    const/16 v1, 0x1706
    invoke-virtual {v0, v1}, Landroid/view/View;->setSystemUiVisibility(I)V
    return-void
.end method


# virtual methods
.method public onBackPressed()V
    .locals 1

    .line 129
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z

    move-result v0

    if-eqz v0, :cond_0

    .line 130
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V

    goto :goto_0

    .line 132
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V

    .line 134
    :goto_0
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 3

    .line 21
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    .line 24
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    const/16 v1, 0x80

    invoke-virtual {v0, v1}, Landroid/view/Window;->addFlags(I)V

    .line 26
    new-instance v0, Landroid/webkit/WebView;

    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V

    iput-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    .line 27
    invoke-virtual {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->setContentView(Landroid/view/View;)V

    .line 28
    invoke-direct {p0}, Lcom/john/pokesurvivor/MainActivity;->enterImmersive()V

    .line 30
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object v0

    .line 31
    const/4 v1, 0x1

    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    .line 33
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    .line 34
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    .line 36
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V

    .line 37
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setAllowContentAccess(Z)V

    .line 38
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setAllowFileAccessFromFileURLs(Z)V

    .line 39
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setAllowUniversalAccessFromFileURLs(Z)V

    .line 41
    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V

    .line 42
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setLoadWithOverviewMode(Z)V

    .line 43
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setUseWideViewPort(Z)V

    .line 44
    const/16 v2, 0x64

    invoke-virtual {v0, v2}, Landroid/webkit/WebSettings;->setTextZoom(I)V

    .line 45
    const/4 v2, -0x1

    invoke-virtual {v0, v2}, Landroid/webkit/WebSettings;->setCacheMode(I)V

    .line 47
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setSupportZoom(Z)V

    .line 48
    invoke-virtual {v0, v1}, Landroid/webkit/WebSettings;->setBuiltInZoomControls(Z)V

    .line 51
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v1, Lcom/john/pokesurvivor/MainActivity$1;

    invoke-direct {v1, p0}, Lcom/john/pokesurvivor/MainActivity$1;-><init>(Lcom/john/pokesurvivor/MainActivity;)V

    const-string v2, "AndroidApp"

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    .line 58
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v1, Lcom/john/pokesurvivor/StartupChromeClient;

    invoke-direct {v1}, Lcom/john/pokesurvivor/StartupChromeClient;-><init>()V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    .line 60
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    new-instance v1, Lcom/john/pokesurvivor/OnlineWebViewClient;

    invoke-direct {v1, p0}, Lcom/john/pokesurvivor/OnlineWebViewClient;-><init>(Lcom/john/pokesurvivor/MainActivity;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V
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
    :sw_done

    .line 75
    if-nez p1, :cond_0

    .line 76
    iget-object p1, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    const-string v0, "https://pokesurvivor.com/"

    invoke-virtual {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->openAppPage(Ljava/lang/String;)V

    goto :goto_0

    .line 78
    :cond_0
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->restoreState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;

    .line 80
    :goto_0
    return-void
.end method

.method protected onDestroy()V
    .locals 1

    const/4 v0, 0x0
    invoke-direct {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->notifyAppActive(Z)V

    .line 119
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    .line 120
    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V

    .line 121
    const/4 v0, 0x0

    iput-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    .line 123
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V

    .line 124
    return-void
.end method

.method protected onPause()V
    .locals 1

    const/4 v0, 0x0
    invoke-direct {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->notifyAppActive(Z)V

    .line 106
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    invoke-virtual {v0}, Landroid/webkit/WebView;->onPause()V

    .line 107
    :cond_0
    invoke-super {p0}, Landroid/app/Activity;->onPause()V

    .line 108
    return-void
.end method

.method protected onResume()V
    .locals 1

    .line 112
    invoke-super {p0}, Landroid/app/Activity;->onResume()V

    const/4 v0, 0x1
    invoke-direct {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->notifyAppActive(Z)V

    .line 113
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    invoke-virtual {v0}, Landroid/webkit/WebView;->onResume()V

    .line 114
    :cond_0
    invoke-direct {p0}, Lcom/john/pokesurvivor/MainActivity;->enterImmersive()V

    .line 115
    return-void
.end method

.method protected onSaveInstanceState(Landroid/os/Bundle;)V
    .locals 1

    .line 100
    invoke-super {p0, p1}, Landroid/app/Activity;->onSaveInstanceState(Landroid/os/Bundle;)V

    .line 101
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->saveState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;

    .line 102
    :cond_0
    return-void
.end method

.method public onWindowFocusChanged(Z)V
    .locals 0

    .line 94
    invoke-super {p0, p1}, Landroid/app/Activity;->onWindowFocusChanged(Z)V

    .line 95
    if-eqz p1, :cond_0

    invoke-direct {p0}, Lcom/john/pokesurvivor/MainActivity;->enterImmersive()V

    .line 96
    :cond_0
    return-void
.end method

.method public getCutoutInsets()Ljava/lang/String;
    .locals 4
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I
    const/16 v1, 0x1c
    if-lt v0, v1, :no_cutout
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    invoke-virtual {v0}, Landroid/view/Window;->getDecorView()Landroid/view/View;
    move-result-object v0
    invoke-virtual {v0}, Landroid/view/View;->getRootWindowInsets()Landroid/view/WindowInsets;
    move-result-object v0
    if-eqz v0, :no_cutout
    invoke-virtual {v0}, Landroid/view/WindowInsets;->getDisplayCutout()Landroid/view/DisplayCutout;
    move-result-object v0
    if-eqz v0, :no_cutout
    new-instance v1, Ljava/lang/StringBuilder;
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v0}, Landroid/view/DisplayCutout;->getSafeInsetLeft()I
    move-result v2
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v2, ","
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v0}, Landroid/view/DisplayCutout;->getSafeInsetTop()I
    move-result v2
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v2, ","
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v0}, Landroid/view/DisplayCutout;->getSafeInsetRight()I
    move-result v2
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v2, ","
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v0}, Landroid/view/DisplayCutout;->getSafeInsetBottom()I
    move-result v2
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v2, ","
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->getResources()Landroid/content/res/Resources;
    move-result-object v0
    invoke-virtual {v0}, Landroid/content/res/Resources;->getDisplayMetrics()Landroid/util/DisplayMetrics;
    move-result-object v0
    iget v3, v0, Landroid/util/DisplayMetrics;->density:F
    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(F)Ljava/lang/StringBuilder;
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
    :no_cutout
    const-string v0, "0,0,0,0,1"
    return-object v0
.end method

.method private notifyAppActive(Z)V
    .locals 3
    iput-boolean p1, p0, Lcom/john/pokesurvivor/MainActivity;->appActive:Z
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :audio_done
    if-eqz p1, :audio_pause
    const-string v1, "if(window.G&&G.Audio){G.Audio.setAppActive(true);}"
    goto :audio_eval
    :audio_pause
    const-string v1, "if(window.G&&G.Audio){G.Audio.setAppActive(false);}"
    :audio_eval
    const/4 v2, 0x0
    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :audio_done
    return-void
.end method

.method public isAppActive()Z
    .locals 1
    iget-boolean v0, p0, Lcom/john/pokesurvivor/MainActivity;->appActive:Z
    return v0
.end method

.method protected onStop()V
    .locals 1
    const/4 v0, 0x0
    invoke-direct {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->notifyAppActive(Z)V
    invoke-super {p0}, Landroid/app/Activity;->onStop()V
    return-void
.end method

.method public openAppPage(Ljava/lang/String;)V
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
.end method

.method public restartAfterRendererGone()V
    .locals 6
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :restart
    invoke-virtual {v0}, Landroid/webkit/WebView;->getParent()Landroid/view/ViewParent;
    move-result-object v1
    instance-of v2, v1, Landroid/view/ViewGroup;
    if-eqz v2, :destroy
    check-cast v1, Landroid/view/ViewGroup;
    invoke-virtual {v1, v0}, Landroid/view/ViewGroup;->removeView(Landroid/view/View;)V
    :destroy
    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V
    const/4 v0, 0x0
    iput-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;
    :restart
    # Two renderer losses within 20 s: stop restarting (avoid a restart loop).
    invoke-static {}, Landroid/os/SystemClock;->elapsedRealtime()J
    move-result-wide v2
    sget-wide v4, Lcom/john/pokesurvivor/MainActivity;->lastRendererRestart:J
    sput-wide v2, Lcom/john/pokesurvivor/MainActivity;->lastRendererRestart:J
    sub-long/2addr v2, v4
    const-wide/16 v4, 0x4e20
    cmp-long v0, v2, v4
    if-gez v0, :fresh
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->finish()V
    return-void
    :fresh
    new-instance v0, Landroid/content/Intent;
    const-class v1, Lcom/john/pokesurvivor/MainActivity;
    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    const v1, 0x10008000
    invoke-virtual {v0, v1}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;
    invoke-virtual {p0, v0}, Lcom/john/pokesurvivor/MainActivity;->startActivity(Landroid/content/Intent;)V
    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->finish()V
    return-void
.end method
