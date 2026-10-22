.class public Lcom/john/pokesurvivor/OpenAppPage;
.super Ljava/lang/Object;
.implements Ljava/lang/Runnable;
.field private activity:Lcom/john/pokesurvivor/MainActivity;
.field private url:Ljava/lang/String;

.method public constructor <init>(Lcom/john/pokesurvivor/MainActivity;Ljava/lang/String;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/john/pokesurvivor/OpenAppPage;->activity:Lcom/john/pokesurvivor/MainActivity;
    iput-object p2, p0, Lcom/john/pokesurvivor/OpenAppPage;->url:Ljava/lang/String;
    return-void
.end method

.method public run()V
    .locals 2
    iget-object v0, p0, Lcom/john/pokesurvivor/OpenAppPage;->activity:Lcom/john/pokesurvivor/MainActivity;
    iget-object v1, p0, Lcom/john/pokesurvivor/OpenAppPage;->url:Ljava/lang/String;
    invoke-virtual {v0, v1}, Lcom/john/pokesurvivor/MainActivity;->openAppPage(Ljava/lang/String;)V
    return-void
.end method
