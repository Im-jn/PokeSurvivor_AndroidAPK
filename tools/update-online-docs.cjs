const fs=require('node:fs');
const p='README.md';let s=fs.readFileSync(p,'utf8');
s=s.replace('dist/PokeSurvivor-ChineseMap-1.2.0.apk','dist/PokeSurvivor-ChineseMap-1.3.0.apk').replace('系统版本 2.2','系统版本 2.3');
const release=fs.readFileSync('docs/online-1.3.0.md','utf8');
s=s.replace(/^## 官网账号登录[\s\S]*?(?=^## )/m,release+'\n\n');
s=s.replace('node tools/cloud-smoke.cjs','node tools/build-online.cjs\nnode tools/test-online.cjs');
s=s.replace('原生 DEX、资源表、图鉴数据和许可文件保持原样','原生 DEX 包含全屏、生命周期及官网加载修改；资源表、图鉴数据和许可文件保持原样');
fs.writeFileSync(p,s);
fs.writeFileSync('dist/安装说明.txt',`PokéSurvivor 中文地图 1.3.0（系统显示版本 2.3）

安装 PokeSurvivor-ChineseMap-1.3.0.apk。已经安装本项目旧版本时可直接覆盖升级，请勿先卸载，以免丢失旧本地存档。

此版默认直接打开官网 HTTPS 游戏，在官网登录界面输入官网用户名与密码。汉化和小地图仍集成在游戏界面中，展开地图自动暂停。

登录页的“本地离线存档”按钮可打开原有本地游客进度；设置内也可切换。官网云存档与旧离线存档分别保存，不自动合并。官网加载失败时提供离线入口。

已通过真实官网页面的只读认证来源检查（HTTP 200）、浏览器游戏与地图验证，以及 APK 资源表、对齐和签名检查。未使用真实账号，也未在 Android 真机上验证此版；请在手机上确认登录与运行情况。
`);
