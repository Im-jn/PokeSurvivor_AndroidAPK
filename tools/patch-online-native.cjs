const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../android/smali/com/john/pokesurvivor');
const p=path.join(dir,'MainActivity.smali');let s=fs.readFileSync(p,'utf8');
s=s.replace('const-string v0, "file:///android_asset/www/index.html"','const-string v0, "https://pokesurvivor.com/"');
s=s.replaceAll('Lcom/john/pokesurvivor/MainActivity$2;','Lcom/john/pokesurvivor/OnlineWebViewClient;');
if(!s.includes('.method public openAppPage('))s+=`
.method public openAppPage(Ljava/lang/String;)V
    .locals 1
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :done
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :done
    return-void
.end method
`;
fs.writeFileSync(p,s);
const bridge=path.join(dir,'MainActivity$1.smali');let b=fs.readFileSync(bridge,'utf8');
for(const [method,url]of [['openOnline','https://pokesurvivor.com/'],['openOffline','file:///android_asset/www/index.html?offline']]){
 if(b.includes('.method public '+method+'()'))continue;
 b+=`
.method public ${method}()V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/john/pokesurvivor/MainActivity$1;->this$0:Lcom/john/pokesurvivor/MainActivity;
    const-string v2, "${url}"
    new-instance v1, Lcom/john/pokesurvivor/OpenAppPage;
    invoke-direct {v1, v0, v2}, Lcom/john/pokesurvivor/OpenAppPage;-><init>(Lcom/john/pokesurvivor/MainActivity;Ljava/lang/String;)V
    invoke-virtual {v0, v1}, Lcom/john/pokesurvivor/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method
`;
}
fs.writeFileSync(bridge,b);console.log('Native launcher now loads the real HTTPS official site');
