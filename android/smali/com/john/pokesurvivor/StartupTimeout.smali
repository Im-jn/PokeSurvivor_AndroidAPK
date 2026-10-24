.class public Lcom/john/pokesurvivor/StartupTimeout;
.super Ljava/lang/Object;
.implements Ljava/lang/Runnable;
.field private client:Lcom/john/pokesurvivor/OnlineWebViewClient;
.field private view:Landroid/webkit/WebView;
.field private generation:I
.field private started:J

.method public constructor <init>(Lcom/john/pokesurvivor/OnlineWebViewClient;Landroid/webkit/WebView;I)V
    .locals 2
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/john/pokesurvivor/StartupTimeout;->client:Lcom/john/pokesurvivor/OnlineWebViewClient;
    iput-object p2, p0, Lcom/john/pokesurvivor/StartupTimeout;->view:Landroid/webkit/WebView;
    iput p3, p0, Lcom/john/pokesurvivor/StartupTimeout;->generation:I
    invoke-static {}, Landroid/os/SystemClock;->elapsedRealtime()J
    move-result-wide v0
    iput-wide v0, p0, Lcom/john/pokesurvivor/StartupTimeout;->started:J
    return-void
.end method

.method public run()V
    .locals 8
    iget-object v0, p0, Lcom/john/pokesurvivor/StartupTimeout;->client:Lcom/john/pokesurvivor/OnlineWebViewClient;
    iget v1, v0, Lcom/john/pokesurvivor/OnlineWebViewClient;->generation:I
    iget v2, p0, Lcom/john/pokesurvivor/StartupTimeout;->generation:I
    if-ne v1, v2, :done
    iget-object v0, v0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;
    iget-boolean v1, v0, Lcom/john/pokesurvivor/MainActivity;->onlineReady:Z
    if-nez v1, :done
    # The official client is still downloading (progress in the last 15 s):
    # check again in 10 s, for at most 4 minutes in all.
    invoke-static {}, Landroid/os/SystemClock;->elapsedRealtime()J
    move-result-wide v1
    iget-wide v3, v0, Lcom/john/pokesurvivor/MainActivity;->startupProgressAt:J
    sub-long v3, v1, v3
    const-wide/16 v5, 0x3a98
    cmp-long v7, v3, v5
    if-gez v7, :give_up
    iget-wide v3, p0, Lcom/john/pokesurvivor/StartupTimeout;->started:J
    sub-long v3, v1, v3
    const-wide/32 v5, 0x3a980
    cmp-long v7, v3, v5
    if-gez v7, :give_up
    iget-object v0, p0, Lcom/john/pokesurvivor/StartupTimeout;->view:Landroid/webkit/WebView;
    const-wide/16 v1, 0x2710
    invoke-virtual {v0, p0, v1, v2}, Landroid/webkit/WebView;->postDelayed(Ljava/lang/Runnable;J)Z
    return-void
    :give_up
    iget-object v0, p0, Lcom/john/pokesurvivor/StartupTimeout;->view:Landroid/webkit/WebView;
    invoke-virtual {v0}, Landroid/webkit/WebView;->stopLoading()V
    const-string v1, "file:///android_asset/www/index.html?offline&auto=timeout"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :done
    return-void
.end method
