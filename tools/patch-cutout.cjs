// Native patch is kept as smali so no replacement Android SDK/JDK is required.
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../android/smali/com/john/pokesurvivor');
const file=path.join(dir,'MainActivity.smali');let text=fs.readFileSync(file,'utf8');
if(!text.includes('.method public getCutoutInsets()')){
 text=text.replace(/\.method private enterImmersive\(\)V[\s\S]*?\.end method/,`.method private enterImmersive()V
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
.end method`);
 let getter=`
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
`;
 for(const edge of ['Left','Top','Right','Bottom'])getter+=`    invoke-virtual {v0}, Landroid/view/DisplayCutout;->getSafeInset${edge}()I
    move-result v2
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v2, ","
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
`;
 getter+=`    invoke-virtual {p0}, Lcom/john/pokesurvivor/MainActivity;->getResources()Landroid/content/res/Resources;
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
`;
 fs.writeFileSync(file,text+getter);
}
const bridge=path.join(dir,'MainActivity$1.smali');let b=fs.readFileSync(bridge,'utf8');
if(!b.includes('.method public getCutoutInsets()'))fs.writeFileSync(bridge,b+`
.method public getCutoutInsets()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;
    invoke-virtual {v0}, Lcom/john/pokesurvivor/MainActivity;->getCutoutInsets()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method
`);
console.log('Native short-edge cutout mode and read-only inset bridge ready');
