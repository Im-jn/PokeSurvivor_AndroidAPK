.class public Lcom/john/pokesurvivor/OnlineServiceWorkerClient;
.super Landroid/webkit/ServiceWorkerClient;

# Service-worker fetches never reach WebViewClient.shouldInterceptRequest.
# Route them through the same interceptor so the official worker cannot
# serve the unmodified client (no Chinese text, no map).
.field private client:Lcom/john/pokesurvivor/OnlineWebViewClient;

.method public constructor <init>(Lcom/john/pokesurvivor/OnlineWebViewClient;)V
    .locals 0
    invoke-direct {p0}, Landroid/webkit/ServiceWorkerClient;-><init>()V
    iput-object p1, p0, Lcom/john/pokesurvivor/OnlineServiceWorkerClient;->client:Lcom/john/pokesurvivor/OnlineWebViewClient;
    return-void
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 2
    iget-object v0, p0, Lcom/john/pokesurvivor/OnlineServiceWorkerClient;->client:Lcom/john/pokesurvivor/OnlineWebViewClient;
    const/4 v1, 0x0
    invoke-virtual {v0, v1, p1}, Lcom/john/pokesurvivor/OnlineWebViewClient;->shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    move-result-object v0
    return-object v0
.end method
