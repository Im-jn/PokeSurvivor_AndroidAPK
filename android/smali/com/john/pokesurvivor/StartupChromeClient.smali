.class public Lcom/john/pokesurvivor/StartupChromeClient;
.super Landroid/webkit/WebChromeClient;

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V
    return-void
.end method

.method public onProgressChanged(Landroid/webkit/WebView;I)V
    .locals 2
    const-string v0, "(function(){if(location.protocol!=='https:'||location.hostname!=='pokesurvivor.com'||window.__psStartupProbe)return;window.__psStartupProbe=true;var t=setInterval(function(){var b=document.getElementById('boot'),p=document.getElementById('tap-start');if((b&&b.classList.contains('hidden'))||(p&&!p.classList.contains('hidden'))){clearInterval(t);if(window.AndroidApp&&AndroidApp.startupReady)AndroidApp.startupReady();}},200);})()"
    const/4 v1, 0x0
    invoke-virtual {p1, v0, v1}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    return-void
.end method
