.class public Lcom/john/pokesurvivor/StartupTimeout;
.super Ljava/lang/Object;

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field private client:Lcom/john/pokesurvivor/OnlineWebViewClient;

.field private generation:I

.field private view:Landroid/webkit/WebView;


# direct methods
.method public constructor <init>(Lcom/john/pokesurvivor/OnlineWebViewClient;Landroid/webkit/WebView;I)V
    .locals 0

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lcom/john/pokesurvivor/StartupTimeout;->client:Lcom/john/pokesurvivor/OnlineWebViewClient;

    iput-object p2, p0, Lcom/john/pokesurvivor/StartupTimeout;->view:Landroid/webkit/WebView;

    iput p3, p0, Lcom/john/pokesurvivor/StartupTimeout;->generation:I

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    iget-object v0, p0, Lcom/john/pokesurvivor/StartupTimeout;->client:Lcom/john/pokesurvivor/OnlineWebViewClient;

    iget v1, v0, Lcom/john/pokesurvivor/OnlineWebViewClient;->generation:I

    iget v2, p0, Lcom/john/pokesurvivor/StartupTimeout;->generation:I

    if-ne v1, v2, :cond_0

    iget-object v0, v0, Lcom/john/pokesurvivor/OnlineWebViewClient;->activity:Lcom/john/pokesurvivor/MainActivity;

    iget-boolean v0, v0, Lcom/john/pokesurvivor/MainActivity;->onlineReady:Z

    if-nez v0, :cond_0

    iget-object v0, p0, Lcom/john/pokesurvivor/StartupTimeout;->view:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->stopLoading()V

    const-string v1, "file:///android_asset/www/index.html?offline&auto=timeout"

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    :cond_0
    return-void
.end method
