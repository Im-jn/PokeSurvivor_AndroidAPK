.class public Lcom/john/pokesurvivor/OfficialCache;
.super Ljava/lang/Object;

# Copies of official game files (one per path and ?v= fingerprint) kept in app
# storage, so after an official update they are downloaded once instead of on
# every start. Written by the page through AndroidApp.storeOfficial, served by
# OnlineWebViewClient for the very same path and version only.

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    return-void
.end method

# File name for (path, version), or null when not an allowed official file.
.method private static name(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 3
    if-eqz p0, :no
    if-eqz p1, :no
    const-string v0, "^/(js/app[.]min[.]js|css/style[.]css|js/core/locales[.]js|js/lang/[A-Za-z-]+[.]js)$"
    invoke-virtual {p0, v0}, Ljava/lang/String;->matches(Ljava/lang/String;)Z
    move-result v0
    if-eqz v0, :no
    const-string v0, "^[0-9A-Za-z_-]{1,40}$"
    invoke-virtual {p1, v0}, Ljava/lang/String;->matches(Ljava/lang/String;)Z
    move-result v0
    if-eqz v0, :no
    invoke-static {p0}, Lcom/john/pokesurvivor/OfficialCache;->prefix(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v0
    new-instance v1, Ljava/lang/StringBuilder;
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
    :no
    const/4 v0, 0x0
    return-object v0
.end method

# "/js/lang/zh-Hans.js" -> "_js_lang_zh-Hans.js@"
.method private static prefix(Ljava/lang/String;)Ljava/lang/String;
    .locals 3
    const/16 v0, 0x2f
    const/16 v1, 0x5f
    invoke-virtual {p0, v0, v1}, Ljava/lang/String;->replace(CC)Ljava/lang/String;
    move-result-object v0
    new-instance v1, Ljava/lang/StringBuilder;
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    const-string v2, "@"
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method private static dir(Landroid/content/Context;)Ljava/io/File;
    .locals 3
    new-instance v0, Ljava/io/File;
    invoke-virtual {p0}, Landroid/content/Context;->getFilesDir()Ljava/io/File;
    move-result-object v1
    const-string v2, "official"
    invoke-direct {v0, v1, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V
    return-object v0
.end method

.method private static file(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)Ljava/io/File;
    .locals 3
    invoke-static {p1, p2}, Lcom/john/pokesurvivor/OfficialCache;->name(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v0
    if-eqz v0, :no
    new-instance v1, Ljava/io/File;
    invoke-static {p0}, Lcom/john/pokesurvivor/OfficialCache;->dir(Landroid/content/Context;)Ljava/io/File;
    move-result-object v2
    invoke-direct {v1, v2, v0}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V
    return-object v1
    :no
    const/4 v1, 0x0
    return-object v1
.end method

.method public static has(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 1
    invoke-static {p0, p1, p2}, Lcom/john/pokesurvivor/OfficialCache;->file(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)Ljava/io/File;
    move-result-object v0
    if-eqz v0, :no
    invoke-virtual {v0}, Ljava/io/File;->isFile()Z
    move-result v0
    return v0
    :no
    const/4 v0, 0x0
    return v0
.end method

.method public static drop(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)V
    .locals 1
    invoke-static {p0, p1, p2}, Lcom/john/pokesurvivor/OfficialCache;->file(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)Ljava/io/File;
    move-result-object v0
    if-eqz v0, :done
    invoke-virtual {v0}, Ljava/io/File;->delete()Z
    :done
    return-void
.end method

# Keep only this version of the file: write a temporary file, then rename.
.method public static store(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 9
    invoke-static {p1, p2}, Lcom/john/pokesurvivor/OfficialCache;->name(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v0
    if-eqz v0, :fail
    if-eqz p3, :fail
    :try_start
    invoke-static {p0}, Lcom/john/pokesurvivor/OfficialCache;->dir(Landroid/content/Context;)Ljava/io/File;
    move-result-object v1
    invoke-virtual {v1}, Ljava/io/File;->mkdirs()Z
    invoke-static {p1}, Lcom/john/pokesurvivor/OfficialCache;->prefix(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v1}, Ljava/io/File;->listFiles()[Ljava/io/File;
    move-result-object v3
    if-eqz v3, :listed
    array-length v4, v3
    const/4 v5, 0x0
    :loop
    if-ge v5, v4, :listed
    aget-object v6, v3, v5
    invoke-virtual {v6}, Ljava/io/File;->getName()Ljava/lang/String;
    move-result-object v7
    invoke-virtual {v7, v2}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v7
    if-eqz v7, :next
    invoke-virtual {v6}, Ljava/io/File;->delete()Z
    :next
    add-int/lit8 v5, v5, 0x1
    goto :loop
    :listed
    new-instance v3, Ljava/io/File;
    new-instance v4, Ljava/lang/StringBuilder;
    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v4, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    const-string v5, ".tmp"
    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v4
    invoke-direct {v3, v1, v4}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V
    new-instance v4, Ljava/io/FileOutputStream;
    invoke-direct {v4, v3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    const-string v5, "UTF-8"
    invoke-virtual {p3, v5}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B
    move-result-object v5
    invoke-virtual {v4, v5}, Ljava/io/FileOutputStream;->write([B)V
    invoke-virtual {v4}, Ljava/io/FileOutputStream;->close()V
    new-instance v4, Ljava/io/File;
    invoke-direct {v4, v1, v0}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V
    invoke-virtual {v3, v4}, Ljava/io/File;->renameTo(Ljava/io/File;)Z
    move-result v0
    return v0
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :fail
    :fail
    const/4 v0, 0x0
    return v0
.end method

# Response for https://pokesurvivor.com/<path>?v=<version> when a copy is kept.
# app.min.js only for the real client request (__ps_original=1): the plain URL
# is answered with the enhancement loader.
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
    const-string v1, "pokesurvivor.com"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :miss
    :try_start
    invoke-virtual {p1}, Landroid/net/Uri;->getPath()Ljava/lang/String;
    move-result-object v0
    if-eqz v0, :miss
    const-string v1, "v"
    invoke-virtual {p1, v1}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v1
    const-string v2, "/js/app.min.js"
    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v2
    if-eqz v2, :allowed
    const-string v2, "__ps_original"
    invoke-virtual {p1, v2}, Landroid/net/Uri;->getQueryParameter(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v2
    const-string v3, "1"
    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v2
    if-eqz v2, :miss
    :allowed
    invoke-static {p0, v0, v1}, Lcom/john/pokesurvivor/OfficialCache;->file(Landroid/content/Context;Ljava/lang/String;Ljava/lang/String;)Ljava/io/File;
    move-result-object v1
    if-eqz v1, :miss
    invoke-virtual {v1}, Ljava/io/File;->isFile()Z
    move-result v2
    if-eqz v2, :miss
    const-string v2, "application/javascript"
    const-string v3, ".css"
    invoke-virtual {v0, v3}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v3
    if-eqz v3, :mime_done
    const-string v2, "text/css"
    :mime_done
    new-instance v3, Ljava/io/FileInputStream;
    invoke-direct {v3, v1}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V
    new-instance v4, Landroid/webkit/WebResourceResponse;
    const-string v5, "UTF-8"
    invoke-direct {v4, v2, v5, v3}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V
    return-object v4
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :miss
    :miss
    const/4 v0, 0x0
    return-object v0
.end method
