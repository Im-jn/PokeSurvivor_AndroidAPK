.class Lcom/john/pokesurvivor/MainActivity$1;
.super Ljava/lang/Object;
.source "MainActivity.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/john/pokesurvivor/MainActivity;->onCreate(Landroid/os/Bundle;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/john/pokesurvivor/MainActivity;


# direct methods
.method public static synthetic $r8$lambda$rPwz3TSDhGkA2Jufv-OyDO01Ru8(Lcom/john/pokesurvivor/MainActivity$1;)V
    .locals 0

    invoke-direct {p0}, Lcom/john/pokesurvivor/MainActivity$1;->lambda$exit$0()V

    return-void
.end method

.method constructor <init>(Lcom/john/pokesurvivor/MainActivity;)V
    .locals 0

    .line 51
    iput-object p1, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method private synthetic lambda$exit$0()V
    .locals 1

    .line 54
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    invoke-virtual {v0}, Lcom/john/pokesurvivor/MainActivity;->finishAndRemoveTask()V

    return-void
.end method


# virtual methods
.method public exit()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 54
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    new-instance v1, Lcom/john/pokesurvivor/MainActivity$1$$ExternalSyntheticLambda0;

    invoke-direct {v1, p0}, Lcom/john/pokesurvivor/MainActivity$1$$ExternalSyntheticLambda0;-><init>(Lcom/john/pokesurvivor/MainActivity$1;)V

    invoke-virtual {v0, v1}, Lcom/john/pokesurvivor/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 55
    return-void
.end method

.method public getCutoutInsets()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    invoke-virtual {v0}, Lcom/john/pokesurvivor/MainActivity;->getCutoutInsets()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method public isAppActive()Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    invoke-virtual {v0}, Lcom/john/pokesurvivor/MainActivity;->isAppActive()Z

    move-result v0

    return v0
.end method

.method public openOffline()V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    const-string v2, "file:///android_asset/www/index.html?offline"

    new-instance v1, Lcom/john/pokesurvivor/OpenAppPage;

    invoke-direct {v1, v0, v2}, Lcom/john/pokesurvivor/OpenAppPage;-><init>(Lcom/john/pokesurvivor/MainActivity;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Lcom/john/pokesurvivor/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method

.method public openOnline()V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    const-string v2, "https://pokesurvivor.com/"

    new-instance v1, Lcom/john/pokesurvivor/OpenAppPage;

    invoke-direct {v1, v0, v2}, Lcom/john/pokesurvivor/OpenAppPage;-><init>(Lcom/john/pokesurvivor/MainActivity;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Lcom/john/pokesurvivor/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method

.method public startupReady()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;

    const/4 v1, 0x1

    iput-boolean v1, v0, Lcom/john/pokesurvivor/MainActivity;->onlineReady:Z

    return-void
.end method
