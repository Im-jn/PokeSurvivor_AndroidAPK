## 官网在线版与离线旧存档（1.3.0）

安装文件：`dist/PokeSurvivor-ChineseMap-1.3.0.apk`，系统显示版本 2.3。可直接覆盖本项目旧版本，请勿先卸载，以免丢失本地存档。

默认在 APK 内打开真实的 https://pokesurvivor.com/ 页面，在官网 HTTPS 域名下使用原有用户名和密码登录、认证 SDK 和云存档流程。原先本地 file:// 页面的登录会被服务端以来源为空拒绝；此版通过真正加载官网解决来源问题。没有伪造 Referer 或 Origin，也不代理账号认证请求。

- 汉化、资源地图、打开地图自动暂停、刘海适配和后台静音继续保留，按钮沿用原有界面风格。原生端仅给官网主游戏脚本加上本地增强模块，官网 DB、Firebase 配置与账号页面流程保持原对象。
- 用户名与密码直接交由官网认证代码处理。本版隐藏 Google 登录按钮。
- 旧版 APK 的本地游客存档保留，可在登录页点“本地离线存档”，或从设置中切换。离线版不尝试云登录；设置中可以返回官网在线版。两种来源的存储独立，不自动合并旧游客进度到官网账号。
- 官网加载失败时提供重试和离线入口。在线版需要联网；官网大幅更新主程序后，增强模块可能需要跟进适配。
- 已用真实官网 HTTPS 页面验证中文登录界面、游客流程、战斗小地图和自动暂停；Firebase 公共项目配置的只读请求返回 HTTP 200，没有来源为空错误。没有输入真实凭据、创建正式账号或写入云存档；真实账号登录和 Android WebView 安装运行仍需在手机上验证。

预览：`verification/online-login.png`、`verification/online-combat.png`、`verification/online-map.png`。验证结果：`verification/online-browser-check.json`。

构建与验证在线模块：`node tools/build-online.cjs`、`node tools/test-online.cjs`（需要联网）。`tools/cloud-smoke.cjs` 是后者的兼容入口。原生实现位于 `android/smali/`；APK 打包命令为 `powershell -NoProfile -ExecutionPolicy Bypass -File tools/package-apk.ps1`。
