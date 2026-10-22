## 网络依赖优化（保持 1.3.2）

当前在线版需要官网主页面、游戏脚本和官网账号服务。此前还会从 `www.gstatic.com/firebasejs/13.0.0/` 下载 Firebase 的 app、auth、firestore、database 四个 SDK 文件；这些文件虽然已经在 APK 内，但在线模式此前没有使用内置副本。

现在原生 WebView 对上述四个固定版本的脚本，以及官网的三种已内置字体，直接返回 APK 中的文件，不需要先访问对应 CDN，也不会先等 CDN 失败。资源映射、文件大小与 SHA256 位于 `source/online/local-resources.json`。只匹配指定 HTTPS 主机和完整路径；其他版本的脚本继续按官网请求，避免拿旧版冒充新版。

账号认证、刷新凭据与云存档请求仍访问官网原本的服务，包括 `identitytoolkit.googleapis.com`、`securetoken.googleapis.com`、`firestore.googleapis.com` 以及项目的 `firebasedatabase.app` 域名。它们无法靠打包静态 SDK 替代。没有把用户密码或令牌转交给第三方镜像或自建代理；页面仍保留官网 HTTPS 来源。

实际网络可达性因地区、运营商和时段而异；本次不能证明所有中国大陆网络都能直连官网账号服务。如果网络导致在线启动失败，保留之前的原生超时／错误回退，自动打开无需登录的本地版，云存档与本地存档分别保存。

验证方法：真实官网页面运行时，通过与原生端一致的静态资源映射提供内置文件，并拒绝所有未映射的 Google CDN 请求；确认四个 SDK、本地字体、中文登录页、游客流程、小地图和地图暂停正常。`verification/online-browser-check.json` 的 requestedHosts 记录网页发起的逻辑请求主机，包含被本地拦截的 URL，不代表都发出了外网请求。没有使用真实账号，也没有在故障用户的手机／运营商网络实测。

参考：[Firebase SDK 加载方式](https://firebase.google.com/docs/web/alt-setup)、[Firebase 身份认证服务端点](https://firebase.google.com/docs/reference/rest/auth)。
