const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../source');
function edit(file,from,to){const p=path.join(root,file),s=fs.readFileSync(p,'utf8');if(!s.includes(from))throw Error('Missing anchor '+file+': '+from);fs.writeFileSync(p,s.replace(from,to));}
edit('js/core/db.js',"const SDK = 'https://www.gstatic.com/firebasejs/13.0.0/';","const SDK = location.protocol === 'file:' ? 'vendor/firebase/' : 'https://www.gstatic.com/firebasejs/13.0.0/';");
edit('js/core/db.js',"if (!/^https?:$/.test(location.protocol)) { localReason = 'file'; return false; }","if (!/^(https?:|file:)$/.test(location.protocol)) { localReason = 'file'; return false; }");
edit('js/core/db.js',"      el.onload = res; el.onerror = () => rej(new Error('No se pudo cargar ' + src));",`      const timer = setTimeout(() => { el.remove(); rej(new Error('SDK timeout')); }, 12000);
      el.onload = () => { clearTimeout(timer); res(); };
      el.onerror = () => { clearTimeout(timer); rej(new Error('No se pudo cargar ' + src)); };`);
edit('js/core/db.js','      if (!u) return false;',"      if (!u) return read(K_SES) === GUEST_KEY ? restoreLocal() : false;");
edit('js/core/db.js',"    if (mode === 'local') return loginLocal(name, pass);","    if (mode === 'local') return { ok: false, error: '无法连接官网账号服务，请检查网络后重新连接。' };");
edit('js/core/db.js',"    if (mode === 'local') return registerLocal(name, pass);","    if (mode === 'local') return { ok: false, error: '无法连接官网账号服务，请检查网络后重新连接。' };");
edit('js/core/db.js',"  async function loginWithGoogle() {","  async function loginWithGoogle() {\n    if (location.protocol === 'file:') return { ok: false, error: '当前 APK 支持官网用户名和密码登录；Google 登录需使用官网。' };");
edit('js/core/db.js',"    user = 'Invitado'; key = GUEST_KEY; guest = true; uid = null;","    clearTimeout(pushT); clearTimeout(retryT); pending = false;\n    user = 'Invitado'; key = GUEST_KEY; guest = true; uid = null;\n    setSync('local');");
edit('js/core/db.js',"  async function logout() {","  async function logout() {\n    commit();\n    if (guest) remove(K_SES);");
edit('js/core/db.js',"    write(K_CLOUD + uid, save);\n    // Sólo se sube", "    write(K_CLOUD + uid, save);\n    remove(K_SES); // A cloud login must not restore an unrelated guest session after logout.\n    // Sólo se sube");
edit('js/game.js',"this.tapToStart(() => { if (!restored) G.DB.playAsGuest(); this.afterLogin(); })","this.tapToStart(() => { if (restored) this.afterLogin(); else this.toLogin(); })");
// Restore the account screen; preserve the APK's persistent guest controls.
const settingsPath=path.join(root,'js/ui/settings-ui.js');let s=fs.readFileSync(settingsPath,'utf8');
const a=s.indexOf('    // APK 改版: sólo invitado'),b=s.indexOf("    const st = G.DB.guest",a);
if(a<0||b<0)throw Error('Missing guest account screen');s=s.slice(0,a)+s.slice(b);
s=s.replace("'Estás jugando como <b>invitado</b>: tu progreso no se guarda al salir.'","'游客进度自动保存在此设备；登录官网账号后读取云存档，游客进度单独保留。'");
s=s.replace('`<button class="btn gold" id="set-login">Crear cuenta o entrar</button>`','`<button class="btn gold" id="set-login">登录官网账号</button><button class="btn" id="set-wipe">清除游客存档</button>`');
s=s.replace('<button class="btn" id="set-logout">Cerrar sesión</button>','<button class="btn gold" id="set-sync">同步云存档</button><button class="btn" id="set-logout">Cerrar sesión</button>');
s=s.replace('  function wire(box) {',`  function wire(box) {
    const sync = $('set-sync'); if (sync) sync.onclick = async () => {
      sync.disabled = true; $('set-msg').textContent = '正在同步…';
      try { G.DB.commit(); await G.DB.flush(); $('set-msg').textContent = G.DB.syncState === 'ok' ? '云存档已同步。' : '暂未同步成功，本地副本已保留，请联网后重试。'; }
      catch (e) { $('set-msg').textContent = '同步失败，本地副本已保留。'; }
      finally { sync.disabled = false; }
    };`);
s=s.replace("    if (G.DB.guest && !confirm('Eres invitado: se perderá todo el progreso. ¿Salir?')) return;",'');
fs.writeFileSync(settingsPath,s);
edit('js/ui/menu.js',"    $('btn-logout').onclick = () => G.ExitApp();","    $('btn-logout').onclick = () => G.SettingsUI.open('acc');");
edit('js/ui/menu.js',"b.classList.add('hidden')","b.classList.add('hidden')");
// Online menus follow the active identity, rather than being permanently hidden.
edit('js/ui/menu.js',"    const s = G.DB.save;","    document.querySelectorAll('#scr-menu [data-go=\"friends\"], #scr-menu [data-go=\"rank\"]').forEach(b => b.classList.toggle('hidden', !G.DB.online));\n    const s = G.DB.save;");
edit('js/ui/login.js',"    if (G.DB.mode === 'cloud') return 'Tu partida se guarda en la nube: entra desde cualquier ordenador. Como invitado no se guarda.';","    if (G.DB.mode === 'cloud') return '使用官网的用户名和密码登录并读取云存档。游客进度单独保存在此设备，不会合并进官网账号。';");
edit('js/ui/login.js',"    const why = G.DB.localReason", "    if (location.protocol === 'file:') return '官网账号服务连接失败。可先玩本地游客，联网后点击重新连接。';\n    const why = G.DB.localReason");
edit('js/ui/login.js',"    $('btn-google').classList.toggle('hidden', G.DB.mode !== 'cloud');",`    $('btn-google').classList.toggle('hidden', G.DB.mode !== 'cloud' || location.protocol === 'file:');
    $('btn-auth').disabled = G.DB.mode !== 'cloud';
    let retry = document.getElementById('btn-cloud-retry');
    if (!retry) { retry = document.createElement('button'); retry.id = 'btn-cloud-retry'; retry.className = 'btn small'; retry.textContent = '重新连接账号服务'; $('login-mode').after(retry); retry.onclick = () => location.reload(); }
    retry.classList.toggle('hidden', G.DB.mode === 'cloud');`);
edit('js/ui/login.js',"      $('btn-auth').disabled = false;", "      $('btn-auth').disabled = G.DB.mode !== 'cloud';");
console.log('Official username/password login and cloud save enabled; local guests retained separately.');
