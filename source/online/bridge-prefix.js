;(function(){'use strict';
if((location.protocol!=='file:'&&(location.protocol!=='https:'||location.hostname!=='pokesurvivor.com'))||window.__PSOnlinePrefix)return;
window.__PSOnlinePrefix=true;
function recover(error){
  window.__PSOnlineInstallError=String(error);
  try{sessionStorage.setItem('ps.online.error',String(error).slice(0,300));}catch(storageError){}
  function show(){if(document.getElementById('ps-enhancement-error'))return;var box=document.createElement('div');box.id='ps-enhancement-error';box.style.cssText='position:fixed;bottom:8px;left:8px;right:8px;z-index:99999;background:#15254b;color:white;padding:10px;font:14px sans-serif';box.textContent='小地图等增强功能加载失败，请重试。 ';var retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=function(){location.reload();};box.appendChild(retry);if(window.AndroidApp&&location.protocol==='file:'&&AndroidApp.openOnline){var online=document.createElement('button');online.textContent='返回在线版';online.onclick=function(){AndroidApp.openOnline();};box.appendChild(online);}else if(window.AndroidApp&&AndroidApp.openOffline){var local=document.createElement('button');local.textContent='本地版本';local.onclick=function(){AndroidApp.openOffline();};box.appendChild(local);}document.body.appendChild(box);}
  if(document.body)show();else addEventListener('DOMContentLoaded',show);
}
if(!Object.hasOwn)Object.hasOwn=function(o,k){return Object.prototype.hasOwnProperty.call(o,k);};
if(!String.prototype.replaceAll)Object.defineProperty(String.prototype,'replaceAll',{configurable:true,writable:true,value:function(a,b){if(a instanceof RegExp)return this.replace(a,b);return this.split(a).join(typeof b==='function'?b(a):b);}});
if(!Array.prototype.flat)Object.defineProperty(Array.prototype,'flat',{configurable:true,writable:true,value:function(d){d=d===undefined?1:Math.floor(d);return d<1?Array.prototype.slice.call(this):Array.prototype.reduce.call(this,function(a,v){return a.concat(Array.isArray(v)?v.flat(d-1):v);},[]);}});
if(!Array.prototype.flatMap)Object.defineProperty(Array.prototype,'flatMap',{configurable:true,writable:true,value:function(f,t){return Array.prototype.map.call(this,f,t).flat();}});
if(!Object.fromEntries)Object.fromEntries=function(it){var o={};Array.from(it,function(e){o[e[0]]=e[1];});return o;};
if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{configurable:true,writable:true,value:function(i){i=Math.trunc(i)||0;if(i<0)i+=this.length;return this[i];}});
try{sessionStorage.removeItem('ps.online.disable-enhancements');}catch(storageError){}
// Offline: never leave the player on an endless loading screen.
if(location.protocol==='file:')setTimeout(function(){
  var boot=document.getElementById('boot'),tap=document.getElementById('tap-start');
  if(window.__PSOnlineInstalled||(boot&&boot.classList.contains('hidden'))||(tap&&!tap.classList.contains('hidden')))return;
  var v=(navigator.userAgent.match(/Chrome\/(\d+)/)||[])[1]||'?';
  recover('游戏没能启动（系统 WebView 版本 Chrome '+v+'）。请在应用商店更新“Android System WebView”或“系统 WebView”后重试。');
},25000);
// Default language: the official Simplified Chinese. locales.js has already
// picked a language from the phone settings before this script runs, so reload
// once when it differs; a language chosen later in Settings is kept.
try{if(!localStorage.getItem('ps.lang')){localStorage.setItem('ps.lang','zh-Hans');if(window.PS_LOCALES&&PS_LOCALES.lang!=='zh-Hans'){location.reload();return;}}}catch(_){}
// Co-op uses WebRTC with Google STUN only, which is unreachable from mainland
// China: add STUN servers that answer there (and Cloudflare's) as well.
try{if(window.RTCPeerConnection&&!window.RTCPeerConnection.__psWrapped){
  var NativePC=window.RTCPeerConnection,EXTRA_STUN=['stun:stun.miwifi.com:3478','stun:stun.hitv.com:3478','stun:stun.cloudflare.com:3478'];
  var WrappedPC=function(config,constraints){
    var c={},k;config=config||{};for(k in config)c[k]=config[k];
    c.iceServers=(config.iceServers||[]).concat([{urls:EXTRA_STUN}]);
    return constraints===undefined?new NativePC(c):new NativePC(c,constraints);
  };
  WrappedPC.prototype=NativePC.prototype;Object.setPrototypeOf(WrappedPC,NativePC);WrappedPC.__psWrapped=true;
  window.RTCPeerConnection=WrappedPC;
}}catch(_){}
// Stale page after an official update: the HTML is cached for 10 minutes (by
// the CDN and by WebView) while version.json is always fresh, so the official
// updater keeps announcing a new version and reloading into the same old page.
// Load the page once under a fresh URL so it comes from the server instead.
(function(){
  if(location.protocol!=='https:')return;
  var me=document.currentScript&&document.currentScript.src||'',mine=(me.match(/[?&]v=([0-9a-f]+)/)||[])[1];
  if(!mine||!window.fetch)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    if(!j||!j.v||j.v===mine)return;
    var key='ps.fresh.'+j.v;
    try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch(_){return;}
    location.replace(location.origin+location.pathname+'?fresh='+encodeURIComponent(j.v)+location.hash);
  }).catch(function(){});
})();
if(navigator.serviceWorker){
  try{navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});navigator.serviceWorker.register=function(){return Promise.resolve(null);};}catch(_){}
}
var install;
// No eval: the official site now sends a CSP without 'unsafe-eval'. The
// compiled code is checked as ES2018 by tests/old-webview.test.cjs.
install=(function install(G, recover) {
  const officialDB = G.DB, officialConfig = G.FIREBASE_CONFIG, officialFlow = G.Flow, officialGame = G.Game, officialStart = G.Game.startRun;
  window.G = G;
  if (location.protocol === "file:") {
    G.DB = (() => {
      const K_ACC = "ps.accounts", K_SES = "ps.session", K_SAVE = "ps.save.";
      const K_CLOUD = "ps.cloud.", K_MIGRATED = "ps.migrated.";
      const VERSION = 3;
      const START_COINS = 500;
      const SDK = location.protocol === "file:" ? "vendor/firebase/" : "https://www.gstatic.com/firebasejs/13.0.0/";
      const NAME_DOMAIN = "jugadores.pokesurvivor.net";
      let mode = "local";
      let localReason = "";
      let user = null;
      let key = null;
      let guest = false;
      let save = null;
      let storageOk = true;
      function read(k) {
        try {
          const v = localStorage.getItem(k);
          return v ? JSON.parse(v) : null;
        } catch (e) {
          storageOk = false;
          return null;
        }
      }
      function write(k, v) {
        try {
          localStorage.setItem(k, JSON.stringify(v));
          return true;
        } catch (e) {
          storageOk = false;
          return false;
        }
      }
      function remove(k) {
        try {
          localStorage.removeItem(k);
        } catch (e) {
        }
      }
      function newSave(name) {
        return {
          v: VERSION,
          name,
          created: Date.now(),
          updated: Date.now(),
          // última modificación (para fusionar)
          coins: START_COINS,
          owned: {},
          // dex -> { at, from: 'starter'|'gacha'|'wild' }
          shiny: {},
          // dex -> { at, from } — variantes shiny conseguidas
          partner: null,
          // dex del Pokémon con el que juegas
          partnerShiny: false,
          // jugar con su versión shiny (si la tienes)
          starter: null,
          // dex que te tocó en el test
          personality: null,
          // { trait, scores }
          upgrades: {},
          // (antiguo) mejoras de la cuenta; ahora van por Pokémon
          pupg: {},
          // dex -> { id -> nivel }: mejoras de cada Pokémon
          tickets: { t1: 0, t10: 0 },
          // tickets del gacha (x1 y x10)
          pity: {},
          // generación del banner -> tiradas sin ★5
          legends: {},
          // dex -> fecha: legendarios vencidos en grietas
          arenas: {},
          // tipo -> fecha: arenas de grieta ganadas
          itemsFound: {},
          // id -> fecha: objetos equipables encontrados
          evoMoves: {},
          // id -> fecha: movimientos evolucionados alguna vez
          ach: {},
          // id -> fecha: logros conseguidos
          missions: {},
          // misiones del día / semana (systems/progress.js)
          profile: { favs: [], title: "" },
          // perfil público: 3 favoritos y título
          stats: {
            runs: 0,
            bestTime: 0,
            bestLevel: 0,
            totalKills: 0,
            pulls: 0,
            coinsEarned: 0,
            shinies: 0,
            bossesTotal: 0,
            riftWins: 0,
            evolutions: 0,
            missionsDone: 0,
            groupRuns: 0,
            bestGroupTime: 0
          }
        };
      }
      function migrate(s, name) {
        const base = newSave(name || s.name);
        for (const k in base) if (s[k] == null) s[k] = base[k];
        for (const k in base.stats) if (s.stats[k] == null) s.stats[k] = base.stats[k];
        if (typeof s.pity === "number") s.pity = { 1: s.pity };
        if (!s.pupgDone) {
          if (s.partner && Object.values(s.upgrades || {}).some((v) => v > 0)) {
            s.pupg[s.partner] = Object.assign({}, s.upgrades);
          }
          s.pupgDone = true;
        }
        s.tickets = Object.assign({ t1: 0, t10: 0 }, s.tickets);
        sanitize(s);
        s.v = VERSION;
        return s;
      }
      function sanitize(s) {
        const n = (v) => Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : 0;
        s.coins = n(s.coins);
        s.tickets.t1 = n(s.tickets.t1);
        s.tickets.t10 = n(s.tickets.t10);
        if (G.DEX_BY) for (const coll of ["owned", "shiny"]) {
          for (const d of Object.keys(s[coll] || {})) if (!G.DEX_BY[d]) delete s[coll][d];
        }
        if (s.pbind && typeof s.pbind === "object") {
          for (const d of Object.keys(s.pbind)) {
            const l = Array.isArray(s.pbind[d]) ? s.pbind[d].slice(0, 4) : [];
            const seen = /* @__PURE__ */ new Set();
            s.pbind[d] = [0, 1, 2, 3].map((i) => {
              const id = l[i];
              if (typeof id !== "string" || G.Moves && !G.Moves.BY_ID[id] || seen.has(id)) return null;
              seen.add(id);
              return id;
            });
          }
        } else s.pbind = {};
        if (s.pban && typeof s.pban === "object") {
          for (const d of Object.keys(s.pban)) {
            const l = Array.isArray(s.pban[d]) ? s.pban[d] : [];
            s.pban[d] = [...new Set(l.filter((id) => typeof id === "string" && (!G.Moves || G.Moves.BY_ID[id])))].slice(0, 3);
          }
        } else s.pban = {};
        if (G.Upgrades) for (const d of Object.keys(s.pupg || {})) {
          const u = s.pupg[d];
          if (!u || typeof u !== "object") {
            delete s.pupg[d];
            continue;
          }
          for (const id of Object.keys(u)) {
            if (!G.Upgrades.BY[id]) delete u[id];
            else u[id] = Math.min(G.Upgrades.BY[id].max, n(u[id]));
          }
        }
      }
      function merge(a, b) {
        if (!a) return b;
        if (!b) return a;
        const newer = (a.updated || 0) >= (b.updated || 0) ? a : b;
        const older = newer === a ? b : a;
        const r = JSON.parse(JSON.stringify(newer));
        for (const coll of ["owned", "shiny"]) {
          r[coll] = r[coll] || {};
          for (const k in older[coll] || {}) {
            if (!r[coll][k] || (older[coll][k].at || 0) < (r[coll][k].at || 0)) r[coll][k] = older[coll][k];
          }
        }
        for (const k in older.upgrades || {}) r.upgrades[k] = Math.max(r.upgrades[k] || 0, older.upgrades[k]);
        r.pupg = r.pupg || {};
        for (const d in older.pupg || {}) {
          const mine = r.pupg[d] = r.pupg[d] || {};
          for (const k in older.pupg[d]) mine[k] = Math.max(mine[k] || 0, older.pupg[d][k]);
        }
        r.pupgDone = r.pupgDone || older.pupgDone;
        for (const coll of ["legends", "arenas", "itemsFound", "evoMoves", "ach"]) {
          r[coll] = r[coll] || {};
          for (const k in older[coll] || {}) if (!r[coll][k]) r[coll][k] = older[coll][k];
        }
        const mo = older.missions || {}, mr = r.missions = r.missions || {};
        for (const [per, list] of [["day", "daily"], ["week", "weekly"]]) {
          if (mr[per] !== mo[per] || !mr[list] || !mo[list]) continue;
          mr[list].forEach((m, i) => {
            const o = mo[list][i];
            if (!o || o.id !== m.id) return;
            m.prog = Math.max(m.prog || 0, o.prog || 0);
            m.claimed = m.claimed || o.claimed;
            m.told = m.told || o.told;
          });
        }
        for (const k in older.stats || {}) r.stats[k] = Math.max(r.stats[k] || 0, older.stats[k] || 0);
        if (r.starter == null) r.starter = older.starter;
        if (r.personality == null) r.personality = older.personality;
        if (r.partner == null || !r.owned[r.partner]) {
          r.partner = older.partner;
          r.partnerShiny = older.partnerShiny;
        }
        r.created = Math.min(a.created || Date.now(), b.created || Date.now());
        r.updated = Math.max(a.updated || 0, b.updated || 0);
        return r;
      }
      const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
      function assignDeep(dst, src) {
        for (const k of Object.keys(dst)) if (!(k in src)) delete dst[k];
        for (const k in src) {
          if (isObj(src[k]) && isObj(dst[k])) assignDeep(dst[k], src[k]);
          else dst[k] = src[k];
        }
      }
      function applyInPlace(s) {
        assignDeep(save, s);
      }
      const VALID = /^[A-Za-z0-9_ñÑáéíóúÁÉÍÓÚ]{3,16}$/;
      async function hash(pass, salt) {
        const text = salt + ":" + pass;
        if (window.crypto && crypto.subtle) {
          const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
          return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
        }
        let h1 = 3735928559, h2 = 1103547991;
        for (let i = 0; i < text.length; i++) {
          const c = text.charCodeAt(i);
          h1 = Math.imul(h1 ^ c, 2654435761);
          h2 = Math.imul(h2 ^ c, 1597334677);
        }
        return "f" + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
      }
      function randomSalt() {
        const a = new Uint8Array(12);
        if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
        else for (let i = 0; i < a.length; i++) a[i] = Math.random() * 256;
        return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
      }
      function loadLocal(k, name) {
        const s = read(K_SAVE + k);
        return s ? migrate(s, name) : newSave(name);
      }
      function beginLocal(k, name) {
        key = k;
        user = name;
        guest = false;
        save = loadLocal(k, name);
        write(K_SES, k);
      }
      async function registerLocal(name, pass) {
        const accs = read(K_ACC) || {};
        const k = name.toLowerCase();
        if (accs[k]) return { ok: false, error: "Ese nombre ya existe." };
        const salt = randomSalt();
        accs[k] = { name, salt, hash: await hash(pass, salt), created: Date.now() };
        if (!write(K_ACC, accs)) return { ok: false, error: "El navegador no deja guardar datos (\xBFmodo inc\xF3gnito?)." };
        beginLocal(k, name);
        write(K_SAVE + k, save);
        return { ok: true, isNew: true };
      }
      async function loginLocal(name, pass) {
        const accs = read(K_ACC) || {};
        const acc = accs[name.toLowerCase()];
        if (!acc || acc.hash !== await hash(pass || "", acc.salt)) {
          return { ok: false, error: "Usuario o contrase\xF1a incorrectos." };
        }
        beginLocal(name.toLowerCase(), acc.name);
        return { ok: true, isNew: !save.partner };
      }
      function restoreLocal() {
        const k = read(K_SES);
        if (!k) return false;
        if (k === GUEST_KEY) {
          key = GUEST_KEY;
          user = "Invitado";
          guest = true;
          save = loadLocal(GUEST_KEY, "Invitado");
          return true;
        }
        const accs = read(K_ACC) || {};
        if (!accs[k]) {
          remove(K_SES);
          return false;
        }
        beginLocal(k, accs[k].name);
        return true;
      }
      async function legacySave(name, pass) {
        const k = (name || "").toLowerCase();
        const acc = (read(K_ACC) || {})[k];
        if (!acc || read(K_MIGRATED + k)) return null;
        if (acc.hash !== await hash(pass || "", acc.salt)) return null;
        const s = read(K_SAVE + k);
        return s ? { key: k, save: migrate(s, acc.name) } : null;
      }
      let auth = null, fs = null, rtdb = null, uid = null, unlisten = null;
      let pushT = 0, retryT = 0, pending = false, pushing = null, lastPush = 0;
      const PUSH_GAP = 30 * 60 * 1e3, PUSH_GAP_URGENT = 3 * 60 * 1e3, HIDE_GAP = 10 * 60 * 1e3;
      let syncState = "local";
      const listeners = /* @__PURE__ */ new Set();
      function setSync(s) {
        syncState = s;
        listeners.forEach((fn) => {
          try {
            fn(s);
          } catch (e) {
          }
        });
      }
      function loadScript(src) {
        return new Promise((res, rej) => {
          const el = document.createElement("script");
          el.src = src;
          el.async = true;
          const timer = setTimeout(() => {
            el.remove();
            rej(new Error("SDK timeout"));
          }, 12e3);
          el.onload = () => {
            clearTimeout(timer);
            res();
          };
          el.onerror = () => {
            clearTimeout(timer);
            rej(new Error("No se pudo cargar " + src));
          };
          document.head.appendChild(el);
        });
      }
      async function initCloud() {
        const cfg = G.FIREBASE_CONFIG;
        if (location.protocol === "file:") {
          localReason = "offline";
          return false;
        }
        if (!/^(https?:|file:)$/.test(location.protocol)) {
          localReason = "file";
          return false;
        }
        if (!cfg || !cfg.apiKey || !cfg.projectId) {
          localReason = "config";
          return false;
        }
        await loadScript(SDK + "firebase-app-compat.js");
        await loadScript(SDK + "firebase-auth-compat.js");
        await loadScript(SDK + "firebase-firestore-compat.js");
        if (cfg.databaseURL) await loadScript(SDK + "firebase-database-compat.js");
        firebase.initializeApp(cfg);
        auth = firebase.auth();
        fs = firebase.firestore();
        rtdb = cfg.databaseURL ? firebase.database() : null;
        if (cfg.emulator) {
          auth.useEmulator("http://127.0.0.1:9099");
          fs.useEmulator("127.0.0.1", 8080);
          if (rtdb) rtdb.useEmulator("127.0.0.1", 9e3);
        }
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        auth.languageCode = "es";
        addEventListener("online", () => {
          if (pending) pushNow();
        });
        const hideFlush = () => {
          if (pending && Date.now() - lastPush > HIDE_GAP) pushNow();
        };
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") hideFlush();
        });
        addEventListener("pagehide", hideFlush);
        return true;
      }
      function nameToEmail(name) {
        const hex = [...new TextEncoder().encode(name.trim().toLowerCase())].map((b) => b.toString(16).padStart(2, "0")).join("");
        return hex + "@" + NAME_DOMAIN;
      }
      function displayNameOf(u) {
        const n = (u && u.displayName || "Entrenador").trim().split(/\s+/)[0].replace(/[^A-Za-z0-9_ñÑáéíóúÁÉÍÓÚ]/g, "");
        return (n || "Entrenador").slice(0, 16);
      }
      const docRef = () => fs.collection("saves").doc(uid);
      const plain = (s) => JSON.parse(JSON.stringify(s));
      async function openCloud(u, opts = {}) {
        uid = u.uid;
        if (G.Signups) G.Signups.report(u);
        const cached = read(K_CLOUD + uid);
        let remote = null, online = true;
        try {
          const snap = await docRef().get();
          remote = snap.exists ? snap.data().save : null;
        } catch (e) {
          if (!cached) throw e;
          online = false;
        }
        let s = merge(cached && migrate(cached), remote && migrate(remote));
        if (!s) s = newSave(opts.name || displayNameOf(u));
        if (opts.legacy) {
          s = merge(s, opts.legacy.save);
          write(K_MIGRATED + opts.legacy.key, uid);
        }
        save = migrate(s, s.name);
        key = uid;
        user = save.name;
        guest = false;
        write(K_CLOUD + uid, save);
        remove(K_SES);
        const same = remote && !opts.legacy && (!cached || (cached.updated || 0) <= (remote.updated || 0));
        lastPush = Date.now();
        if (!online) {
          pending = true;
          setSync("offline");
          scheduleRetry();
        } else if (same) setSync("ok");
        else pushNow();
      }
      function stopListening() {
        if (unlisten) {
          unlisten();
          unlisten = null;
        }
      }
      function pushNow() {
        if (mode !== "cloud" || guest || !save || !uid) return Promise.resolve();
        if (pushing) {
          pending = true;
          return pushing.then(() => pending ? pushNow() : void 0);
        }
        clearTimeout(pushT);
        pushT = 0;
        pushDue = 0;
        if (navigator.onLine === false) {
          pending = true;
          setSync("offline");
          scheduleRetry();
          return Promise.resolve();
        }
        pending = false;
        lastPush = Date.now();
        setSync("syncing");
        let merged = null;
        const tr = fs.runTransaction(async (tx) => {
          const ref = docRef();
          const snap = await tx.get(ref);
          const remote = snap.exists ? migrate(snap.data().save) : null;
          merged = remote ? merge(plain(save), remote) : plain(save);
          tx.set(ref, { save: merged, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), v: VERSION });
        });
        const timeout = new Promise((_, rej) => setTimeout(() => rej({ code: "unavailable" }), 12e3));
        let failed = false;
        pushing = Promise.race([tr, timeout]).then(() => {
          fails = 0;
          rejects = 0;
          if (merged && save) {
            applyInPlace(merge(plain(save), merged));
            write(K_CLOUD + uid, save);
          }
          setSync(pending ? "pending" : "ok");
          if (G.UI && G.UI.refreshCoins) G.UI.refreshCoins();
        }).catch((e) => {
          console.warn("[DB] no se pudo sincronizar:", e.code || e.message);
          if (e.code === "permission-denied" && ++rejects >= 10) {
            rejects = 0;
            return adoptRemote();
          }
          pending = true;
          failed = true;
          setSync(navigator.onLine === false || e.code === "unavailable" ? "offline" : "pending");
          scheduleRetry();
        }).finally(() => {
          pushing = null;
          if (!failed && pending && syncState === "pending") schedulePush(Math.max(1500, PUSH_GAP - (Date.now() - lastPush)));
        });
        return pushing;
      }
      let rejects = 0;
      async function adoptRemote() {
        try {
          const snap = await docRef().get();
          if (snap.exists && save) {
            applyInPlace(migrate(snap.data().save));
            write(K_CLOUD + uid, save);
          }
          pending = false;
          setSync("ok");
          if (G.UI && G.UI.refreshCoins) G.UI.refreshCoins();
        } catch (e) {
          pending = true;
          setSync("pending");
          scheduleRetry();
        }
      }
      let pushDue = 0;
      function schedulePush(ms) {
        const due = Date.now() + ms;
        if (pushT && pushDue && pushDue <= due) return;
        clearTimeout(pushT);
        pushDue = due;
        pushT = setTimeout(() => {
          pushT = 0;
          pushDue = 0;
          pushNow();
        }, ms);
      }
      let fails = 0;
      function scheduleRetry() {
        const ms = Math.min(10 * 6e4, 15e3 * Math.pow(2, fails)) * (0.8 + Math.random() * 0.4);
        fails = Math.min(fails + 1, 8);
        clearTimeout(retryT);
        retryT = setTimeout(() => {
          if (pending) pushNow();
        }, ms);
      }
      function authError(e) {
        const c = e && e.code || "";
        const M = {
          "auth/email-already-in-use": "Ese nombre ya existe.",
          "auth/invalid-credential": "Usuario o contrase\xF1a incorrectos.",
          "auth/invalid-login-credentials": "Usuario o contrase\xF1a incorrectos.",
          "auth/wrong-password": "Usuario o contrase\xF1a incorrectos.",
          "auth/user-not-found": "Usuario o contrase\xF1a incorrectos.",
          "auth/weak-password": "La contrase\xF1a debe tener al menos 6 caracteres.",
          "auth/too-many-requests": "Demasiados intentos seguidos. Espera un poco.",
          "auth/network-request-failed": "Sin conexi\xF3n a internet.",
          "auth/popup-blocked": "El navegador bloque\xF3 la ventana de Google. Permite las ventanas emergentes.",
          "auth/unauthorized-domain": "Este dominio no est\xE1 autorizado en Firebase (Authentication > Configuraci\xF3n > Dominios autorizados).",
          "auth/operation-not-allowed": "Ese m\xE9todo de inicio de sesi\xF3n no est\xE1 activado en Firebase.",
          // Registro de cuentas nuevas desactivado en Firebase (Authentication > Configuración).
          "auth/admin-restricted-operation": "Ahora mismo no se pueden crear cuentas nuevas. Si ya tienes cuenta, entra normal; si no, puedes jugar como invitado.",
          "auth/requires-recent-login": "Por seguridad, vuelve a iniciar sesi\xF3n y repite la operaci\xF3n.",
          "permission-denied": "La base de datos rechaz\xF3 el acceso (revisa las reglas de Firestore).",
          "unavailable": "Sin conexi\xF3n con la base de datos."
        };
        if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return "";
        if (/error-code:-47|BLOCKING_FUNCTION|resource-exhausted|cuentas nuevas/i.test(c + " " + (e && e.message || "")))
          return "Este mes ya no quedan plazas para cuentas nuevas (vuelven el 1 de " + (G.Signups ? G.Signups.nextMonthName() : "mes que viene") + "). Mientras, puedes jugar como invitado.";
        return M[c] || "Error: " + (c || e && e.message || "desconocido");
      }
      let readyP = null;
      function ready() {
        if (readyP) return readyP;
        readyP = (async () => {
          try {
            if (await initCloud()) mode = "cloud";
          } catch (e) {
            console.warn("[DB] sin nube:", e.message);
            localReason = "error";
            mode = "local";
          }
          if (mode === "local") {
            setSync("local");
            return restoreLocal();
          }
          const u = await new Promise((res) => {
            const off = auth.onAuthStateChanged((x) => {
              off();
              res(x);
            });
          });
          if (!u) return read(K_SES) === GUEST_KEY ? restoreLocal() : false;
          try {
            await openCloud(u);
            return true;
          } catch (e) {
            console.warn("[DB] no se pudo abrir la partida:", e.code || e.message);
            return false;
          }
        })();
        return readyP;
      }
      async function register(name, pass) {
        name = (name || "").trim();
        if (!VALID.test(name)) return { ok: false, error: "El nombre debe tener 3-16 letras, n\xFAmeros o _." };
        const min = mode === "cloud" ? 6 : 4;
        if ((pass || "").length < min) return { ok: false, error: `La contrase\xF1a debe tener al menos ${min} caracteres.` };
        if (mode === "local") return { ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u5B98\u7F51\u8D26\u53F7\u670D\u52A1\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u65B0\u8FDE\u63A5\u3002" };
        if (G.Signups && !await G.Signups.check()) return { ok: false, error: "Este mes ya no quedan plazas para cuentas nuevas (vuelven el 1 de " + G.Signups.nextMonthName() + "). Mientras, puedes jugar como invitado." };
        try {
          const legacy = await legacySave(name, pass);
          const cred = await auth.createUserWithEmailAndPassword(nameToEmail(name), pass);
          if (G.Signups) G.Signups.markNew(cred.user.uid);
          await openCloud(cred.user, { name, legacy });
          return { ok: true, isNew: !save.partner, imported: !!legacy };
        } catch (e) {
          return { ok: false, error: authError(e) };
        }
      }
      async function login2(name, pass) {
        name = (name || "").trim();
        if (mode === "local") return { ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u5B98\u7F51\u8D26\u53F7\u670D\u52A1\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u65B0\u8FDE\u63A5\u3002" };
        const previous = { user, key, save, uid, guest };
        try {
          const legacy = await legacySave(name, pass);
          const cred = await auth.signInWithEmailAndPassword(nameToEmail(name), pass || "");
          await openCloud(cred.user, { name, legacy });
          return { ok: true, isNew: !save.partner, imported: !!legacy };
        } catch (e) {
          if (!previous.uid) {
            try {
              await auth.signOut();
            } catch (_) {
            }
          }
          ({ user, key, save, uid, guest } = previous);
          return { ok: false, error: authError(e) };
        }
      }
      async function loginWithGoogle() {
        if (location.protocol === "file:") return { ok: false, error: "\u5F53\u524D APK \u652F\u6301\u5B98\u7F51\u7528\u6237\u540D\u548C\u5BC6\u7801\u767B\u5F55\uFF1BGoogle \u767B\u5F55\u9700\u4F7F\u7528\u5B98\u7F51\u3002" };
        if (mode !== "cloud") return { ok: false, error: "Entrar con Google necesita la versi\xF3n publicada del juego." };
        try {
          const cred = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
          if (cred.additionalUserInfo && cred.additionalUserInfo.isNewUser && G.Signups && !await G.Signups.check()) {
            await cred.user.delete().catch(() => {
            });
            await auth.signOut().catch(() => {
            });
            return { ok: false, error: "Este mes ya no quedan plazas para cuentas nuevas (vuelven el 1 de " + G.Signups.nextMonthName() + "). Mientras, puedes jugar como invitado." };
          }
          if (cred.additionalUserInfo && cred.additionalUserInfo.isNewUser && G.Signups) G.Signups.markNew(cred.user.uid);
          await openCloud(cred.user, { name: displayNameOf(cred.user) });
          return { ok: true, isNew: !save.partner };
        } catch (e) {
          return { ok: false, error: authError(e) };
        }
      }
      function setName(n) {
        if (!save || guest) return;
        save.name = n;
        user = n;
        commit();
      }
      const GUEST_KEY = "guest";
      function playAsGuest() {
        clearTimeout(pushT);
        clearTimeout(retryT);
        pending = false;
        user = "Invitado";
        key = GUEST_KEY;
        guest = true;
        uid = null;
        setSync("local");
        const s = read(K_SAVE + GUEST_KEY);
        save = s ? migrate(s, "Invitado") : newSave("Invitado");
        write(K_SAVE + GUEST_KEY, save);
        write(K_SES, GUEST_KEY);
        return { ok: true, isNew: !s };
      }
      function commit(urgent = false) {
        if (!key || !save) return false;
        if (guest && key !== GUEST_KEY) return false;
        save.updated = Date.now();
        if (guest || mode === "local") return write(K_SAVE + key, save);
        write(K_CLOUD + uid, save);
        pending = true;
        setSync("pending");
        schedulePush(Math.max(1200, (urgent ? PUSH_GAP_URGENT : PUSH_GAP) - (Date.now() - lastPush)));
        return true;
      }
      const leaveHooks = [];
      async function logout() {
        commit();
        if (guest) remove(K_SES);
        for (const fn of leaveHooks) {
          try {
            await fn("logout");
          } catch (e) {
          }
        }
        if (mode === "cloud" && !guest && save) {
          if (pending) {
            try {
              await pushNow();
            } catch (e) {
            }
          }
          stopListening();
          try {
            await auth.signOut();
          } catch (e) {
          }
        } else if (mode === "local" && !guest) {
          commit();
          remove(K_SES);
        }
        clearTimeout(pushT);
        clearTimeout(retryT);
        user = key = save = uid = null;
        guest = false;
        pending = false;
        setSync(mode === "cloud" ? "ok" : "local");
      }
      function nameAccount() {
        return !!(auth && auth.currentUser && (auth.currentUser.email || "").endsWith("@" + NAME_DOMAIN));
      }
      async function deleteAccount(pass) {
        if (guest || !key) return { ok: false, error: "No hay cuenta que borrar." };
        if (mode === "local") {
          const accs = read(K_ACC) || {};
          delete accs[key];
          write(K_ACC, accs);
          remove(K_SAVE + key);
          remove(K_SES);
          user = key = save = null;
          return { ok: true };
        }
        try {
          const cu = auth.currentUser;
          if (nameAccount()) {
            if (!pass) return { ok: false, error: "Escribe tu contrase\xF1a." };
            await cu.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(cu.email, pass));
          } else {
            await cu.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
          }
          clearTimeout(pushT);
          clearTimeout(retryT);
          pending = false;
          stopListening();
          for (const fn of leaveHooks) await fn("delete");
          await docRef().delete();
          remove(K_CLOUD + uid);
          await auth.currentUser.delete();
          user = key = save = uid = null;
          return { ok: true };
        } catch (e) {
          return { ok: false, error: authError(e) };
        }
      }
      setInterval(() => {
        try {
          commit();
        } catch (e) {
        }
      }, 2e4);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          try {
            commit();
          } catch (e) {
          }
        }
      });
      addEventListener("pagehide", () => {
        try {
          commit();
        } catch (e) {
        }
      });
      function owns(dex) {
        return !!(save && save.owned[dex]);
      }
      function grant(dex, from) {
        if (!save.owned[dex]) save.owned[dex] = { at: Date.now(), from };
      }
      function ownsShiny(dex) {
        return !!(save && save.shiny && save.shiny[dex]);
      }
      function upgradesOf(dex) {
        if (!save) return {};
        save.pupg = save.pupg || {};
        return save.pupg[dex] || (save.pupg[dex] = {});
      }
      function grantShiny(dex, from) {
        grant(dex, from);
        if (save.shiny[dex]) return false;
        save.shiny[dex] = { at: Date.now(), from };
        return true;
      }
      function isFav(dex) {
        return !!(save && save.dfav && +save.dfav[dex] > 0);
      }
      function setFav(dex, on) {
        if (!save) return;
        save.dfav = save.dfav || {};
        save.dfav[dex] = on ? Date.now() : -Date.now();
        commit();
      }
      async function saveNow() {
        if (guest || !save) return { ok: false, why: "guest" };
        if (mode !== "cloud") {
          commit(true);
          return { ok: true, why: "local" };
        }
        await pushNow();
        return syncState === "ok" ? { ok: true } : { ok: false, why: syncState === "offline" ? "offline" : "error" };
      }
      return {
        ready,
        register,
        login: login2,
        loginWithGoogle,
        playAsGuest,
        logout,
        commit,
        deleteAccount,
        flush: pushNow,
        isFav,
        setFav,
        saveNow,
        get hasGoogle() {
          return false;
        },
        async linkGoogle() {
          return { ok: false, error: "Inicia sesi\xF3n primero." };
        },
        resetLocalSave() {
          if (key !== GUEST_KEY) return false;
          remove(K_SAVE + key);
          remove(K_SES);
          return true;
        },
        owns,
        grant,
        ownsShiny,
        grantShiny,
        merge,
        setName,
        upgradesOf,
        onSync(fn) {
          listeners.add(fn);
        },
        onLeave(fn) {
          leaveHooks.push(fn);
        },
        /** Acceso de bajo nivel para los módulos de red (sólo en modo nube). */
        get fb() {
          return mode === "cloud" ? { auth, fs, rtdb, uid, emulator: !!(G.FIREBASE_CONFIG || {}).emulator } : null;
        },
        /** ¿Está disponible lo online (amigos, ranking, multijugador)? */
        get online() {
          return mode === "cloud" && !guest && !!uid && !!save;
        },
        /** ¿La cuenta es de usuario y contraseña (no de Google)? */
        get nameAccount() {
          return nameAccount();
        },
        get mode() {
          return mode;
        },
        get localReason() {
          return localReason;
        },
        get syncState() {
          return syncState;
        },
        get user() {
          return user;
        },
        get guest() {
          return guest;
        },
        get save() {
          return save;
        },
        get loggedIn() {
          return !!save;
        },
        get storageOk() {
          return storageOk;
        },
        START_COINS
      };
    })();
    const login = G.Flow.toLogin;
    G.Flow.toLogin = function() {
      if (!G.DB.save) G.DB.playAsGuest();
      this.afterLogin();
    };
  }
  for (const [key, value] of Object.entries({ minimap: true, mapPredict: true, mapTerrain: true, mapRange: 96, mapFilters: ["chest", "bigchest", "altar", "spring"] })) if (G.Settings.get(key) === void 0) G.Settings.set(key, value);
  const style = document.createElement("style");
  style.textContent = `/* PMD menu styling, shared buttons and settings rows from style.css. */
html[lang="zh"] { --font:'Pixelify','Noto Sans CJK SC','Microsoft YaHei',system-ui,sans-serif; }
:root { --ps-safe-left:env(safe-area-inset-left,0px); --ps-safe-top:env(safe-area-inset-top,0px); --ps-safe-right:env(safe-area-inset-right,0px); --ps-safe-bottom:env(safe-area-inset-bottom,0px); }
.scr { padding-left:max(20px,var(--ps-safe-left)); padding-right:max(20px,var(--ps-safe-right)); }
.topbar { right:calc(16px + var(--ps-safe-right)); top:calc(14px + var(--ps-safe-top)); }
#scr-map { z-index:24; padding:calc(16px + var(--ps-safe-top)) calc(16px + var(--ps-safe-right)) calc(16px + var(--ps-safe-bottom)) calc(16px + var(--ps-safe-left)); }
.map-box { width:min(960px,100%); padding:18px 22px; overflow:hidden; display:flex; flex-direction:column; }
.map-heading { flex-shrink:0; gap:16px; }
.map-heading .sub { margin:0 0 10px; font-size:12px; }
.map-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(200px,270px); gap:20px; min-height:0; overflow:auto; }
.map-view { min-width:0; }
#resource-map { display:block; width:100%; max-width:min(100%,calc(100dvh - 180px)); margin:auto; aspect-ratio:1; height:auto; background:#0b1838; border:2px solid var(--edge-in); border-radius:6px; touch-action:none; cursor:crosshair; }
#resource-map:focus-visible { outline:2px solid var(--gold); outline-offset:2px; }
.map-tools { min-width:0; overflow:auto; overscroll-behavior:contain; }
.map-tools h3 { margin:14px 0 8px; }
#map-filters { gap:6px; }
#map-filters .chip { display:flex; align-items:center; gap:6px; font-size:13px; min-height:36px; }
#map-filters i { width:8px; height:8px; display:inline-block; border-radius:2px; }
#map-filters canvas { width:22px; height:22px; flex-shrink:0; }
#map-legend { display:flex; flex-wrap:wrap; gap:5px 12px; margin-top:12px; font-size:12px; color:var(--muted); }
#map-legend span { display:flex; align-items:center; gap:4px; }
#map-legend canvas { width:24px; height:24px; }
#map-legend p { width:100%; margin:4px 0; font-size:11px; }
.map-heading .map-pause-status { color:#ffe16d; font-size:12px; font-weight:700; margin:0 0 4px; }
#map-options { display:grid; gap:8px; margin-top:14px; }
#map-options .btn { text-align:left; }
#map-selection { min-height:1.5em; margin:8px 0 0; color:var(--gold); font-size:12px; }
.map-tools .note { font-size:12px; line-height:1.6; margin:10px 0; }
@media(max-height:500px) and (min-width:600px) {
  #scr-map { padding-top:10px; padding-bottom:10px; }
  .map-box { padding:10px 16px; }
  .map-heading h2 { font-size:20px; }
  .map-layout { grid-template-columns:minmax(0,1fr) minmax(210px,42%); gap:16px; }
  #resource-map { max-width:calc(100dvh - 140px); }
}
@media(max-width:599px) {
  .map-box { padding:14px; overflow:auto; }
  .map-layout { display:block; overflow:visible; }
  .map-tools { margin-top:12px; overflow:visible; }
  #resource-map { max-width:min(100%,45dvh); }
  .map-heading h2 { font-size:20px; }
}

/* Shared by the official HTTPS client and the packaged offline client. */
.ps-dex-content, .ps-dex-action { display:contents; }
.ps-offline #btn-logout { display:none!important; }
.news-translation-tools { flex-shrink:0; flex-wrap:wrap; gap:6px; margin:4px 0 8px; }
.news-translation-tools .note { margin:0; font-size:11px; }
.news-translation-tools .btn { min-height:32px; padding:4px 8px; font-size:12px; }
.news-body { min-height:0; }
:root { --ps-chrome-bottom:0px; }
.topbar { left:calc(12px + var(--ps-safe-left)); right:calc(12px + var(--ps-safe-right)); top:calc(10px + var(--ps-safe-top)); justify-content:flex-end; flex-wrap:wrap; gap:8px; min-width:0; }
.topbar > * { flex-shrink:0; }
#user-pill { min-width:0; max-width:180px; }
#user-pill span[translate="no"] { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#scr-menu { padding:calc(var(--ps-chrome-bottom) + 18px) max(14px,var(--ps-safe-right)) max(14px,var(--ps-safe-bottom)) max(14px,var(--ps-safe-left)); gap:24px; }
#scr-menu .menu-left { padding:8px 12px; }
#scr-menu .menu-right { padding:4px 6px; }
.scr:not(#scr-menu):not(#scr-login):not(#scr-map) { padding-top:max(16px,calc(var(--ps-chrome-bottom) + 16px)); }
.scr:not(#scr-menu):not(#scr-login):not(#scr-map) > .box { max-height:calc(var(--ps-vh,100vh) - var(--ps-chrome-bottom,0px) - 36px - var(--ps-safe-bottom,0px)); }
#scr-login { padding:12px max(16px,var(--ps-safe-right)) 12px max(16px,var(--ps-safe-left)); align-items:center; }
#scr-login > .box { width:min(420px,100%)!important; max-height:calc(100dvh - 24px); overflow-y:auto; overscroll-behavior:contain; }
#login-form { display:flex; flex-direction:column; }
#login-form .field { width:100%; min-height:40px; font-size:16px; }
#login-form label { margin:8px 0 4px; }
#login-form .err:empty { display:none; }
#scr-login .row { flex-wrap:wrap; gap:8px; }
#scr-login .row > .btn { min-height:38px; }
@media (max-height:520px) and (min-width:600px) {
  .topbar { gap:7px; }
  .topbar .pill { padding:4px 9px; font-size:13px; gap:5px; min-height:34px; }
  .topbar .btn.small { padding:5px 9px; min-height:34px; font-size:13px; }
  #user-pill { max-width:150px; }
  #scr-menu { gap:18px; }
  #scr-menu .menu-right { width:min(54vw,480px); }
  #scr-menu .menu-right .box { padding:10px 12px; }
  #scr-menu .menu-list { gap:6px 10px; }
  #scr-menu .menu-item { min-height:38px; padding:6px 8px; }
  #scr-menu .menu-item.play { min-height:55px; margin-bottom:4px; }
  #scr-login > .box { padding:12px 20px; }
  #scr-login .logo { margin-bottom:4px; }
  #scr-login .logo .t1 { font-size:26px; }
  #scr-login .logo .t2, #scr-login .login-tag { display:none; }
  #scr-login .login-official { margin:4px 0; font-size:11px; }
  #scr-login .tabs { margin-bottom:4px; }
  #scr-login .tab { padding:5px 8px; }
  #login-form label { margin:5px 0 3px; font-size:12px; }
  #login-form .field { min-height:36px; padding:5px 10px; }
  #scr-login .btn { padding:6px 12px; }
  #scr-login .note, #scr-login #login-mode { margin:6px 0; font-size:11px; }
}
/* Collection and gacha need independent scrolling areas on low screens. */
@media (max-height:600px) and (min-width:600px) {
  #scr-dex, #scr-gacha { padding-bottom:max(10px,var(--ps-safe-bottom)); }
  #scr-dex > .box, #scr-gacha > .box {
    height:100%; min-height:0; padding:10px 12px;
    display:flex; flex-direction:column; overflow:hidden;
  }
  #scr-dex > .box > .row, #scr-gacha > .box > .row { flex-shrink:0; min-height:32px; }
  #scr-dex h2, #scr-gacha h2 { font-size:20px; margin:0; }
  #scr-dex [data-back], #scr-gacha [data-back] { min-height:32px; padding:4px 12px; font-size:13px; }
  #dex-gens, #gacha-gens { flex-shrink:0; margin-top:4px; padding:2px 0 5px; gap:5px; }
  #dex-gens .gen-tab, #gacha-gens .gen-tab { min-height:36px; padding:4px 10px; }
  #dex-gens b, #gacha-gens b { font-size:12px; }
  #dex-gens small, #gacha-gens small { font-size:10px; }
  #scr-dex .split, #scr-gacha .split { flex:1; min-height:0; gap:10px; margin-top:4px!important; }
  #scr-dex .split { grid-template-columns:minmax(0,1fr) minmax(190px,30%); }
  #scr-dex .split > div:first-child { display:flex; flex-direction:column; min-height:0; min-width:0; }
  #dex-filters { display:flex; flex-wrap:nowrap; flex-shrink:0; gap:4px; overflow-x:auto; padding:0 0 5px; margin:0; }
  #dex-filters .chip { flex-shrink:0; min-height:30px; padding:3px 8px; font-size:11px; }
  #dex-grid { flex:1; min-height:0; max-height:none; grid-template-columns:repeat(auto-fill,minmax(74px,1fr)); gap:5px; align-content:start; padding:3px; }
  #dex-grid .cell { padding:12px 2px 4px; border-radius:7px; }
  #dex-grid .cell canvas { width:60px; height:52px; }
  #dex-grid .cell b { font-size:11px; }
  #dex-grid .cell .no { font-size:9px; }
  #dex-grid .stars-row img { width:12px!important; height:12px!important; }
  #dex-detail { display:flex; flex-direction:column; min-height:0; overflow:hidden; padding:6px 8px; }
  #dex-detail .ps-dex-content { display:block; flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:4px; }
  #dex-detail .ps-dex-action { display:block; flex-shrink:0; padding-top:6px; }
  #dex-detail .ps-dex-action:empty { display:none; }
  #dex-detail .stage { display:block; width:96px; height:83px; margin:2px auto 8px; }
  #dex-detail h3 { font-size:16px; margin:2px 0; }
  #dex-detail .stat { grid-template-columns:54px 1fr 30px; font-size:11px; gap:4px; margin:3px 0; }
  #dex-detail p { font-size:11px!important; margin:5px 0!important; }
  #dex-detail .ps-dex-action .btn { position:static; margin:0; min-height:34px; padding:5px 6px; font-size:12px; box-shadow:none; }
  #scr-gacha .split { grid-template-columns:minmax(0,1fr) minmax(185px,28%); }
  #scr-gacha .split > div:first-child { display:flex; flex-direction:column; min-height:0; min-width:0; }
  #scr-gacha .banner { flex:1; min-height:0; padding:10px; overflow-y:auto; display:grid; grid-template-columns:minmax(0,1fr) minmax(90px,40%); column-gap:8px; align-content:start; }
  #scr-gacha .banner h3 { font-size:18px; grid-column:1; }
  #banner-desc { font-size:12px; line-height:1.5; grid-column:1; }
  #gacha-owned { font-size:11px; grid-column:1; }
  #scr-gacha .banner .feat { grid-column:2; grid-row:1 / 4; align-self:center; align-items:center; height:100px; margin:0; gap:0; }
  #gacha-feat canvas { flex:0 1 64px; min-width:0; width:min(64px,33%); height:auto; aspect-ratio:170 / 190; }
  #scr-gacha .split > div:first-child > .row { flex-shrink:0; gap:6px; margin-top:8px!important; }
  #scr-gacha .split > div:first-child > .row .btn { min-width:0; min-height:36px; padding:5px 6px; font-size:12px; }
  #gacha-tickets, #gacha-pity { flex-shrink:0; font-size:10px; line-height:1.3; margin:5px 0 0; }
  #gacha-rates { min-height:0; overflow-y:auto; padding:8px 10px; font-size:11px; }
  #gacha-rates h3 { font-size:16px; }
  #gacha-rates .note { font-size:10px; line-height:1.5; margin-top:6px; }
}
/* Run mode switch under the Play button: Arceus at minute 30 or endless. */
#ps-run-mode { grid-column:1 / -1; display:flex; width:100%; gap:6px; margin:2px 0 6px; }
#ps-run-mode button { flex:1 1 0; min-width:0; min-height:32px; padding:3px 8px; font:inherit; font-size:14px; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-radius:8px; border:1px solid rgba(255,255,255,.22); background:rgba(0,0,0,.22); color:var(--muted); cursor:pointer; }
#ps-run-mode button.on { background:rgba(255,214,90,.18); border-color:var(--gold); color:var(--gold); }
.ps-mode-side > .menu-item.play { grid-column:1 / 2!important; min-width:0; }
.ps-mode-side > #ps-run-mode { grid-column:2 / 3; flex-direction:column; justify-content:center; margin:0; gap:4px; }
.ps-mode-side > #ps-run-mode button { flex:0 0 auto; }
@media (max-height:520px) {
  #ps-run-mode { margin:0 0 3px; gap:4px; }
  #ps-run-mode button { min-height:26px; padding:2px 6px; font-size:12px; }
}
/* Dialogs taller than the screen scroll instead of being cut off at both ends
   (some Android WebViews ignore the box's max-height inside a centered flex). */
.scr.dim:not(#scr-map) { overflow-y:auto; align-items:flex-start; }
.scr.dim:not(#scr-map) > .box { margin-top:auto; margin-bottom:auto; }
/* Run summary on landscape phones: four columns, compact cards. */
@media (max-height:520px) and (min-width:600px) {
  #scr-over > .box { width:min(760px,100%)!important; }
  #scr-over .box h2 { margin-bottom:2px; }
  #scr-over .stats { grid-template-columns:repeat(4,1fr); gap:5px; margin:6px 0 8px; }
  #scr-over .stats > div { padding:4px 8px; }
  #scr-over .stats > div > span:first-child { font-size:11px; }
  #scr-over .stats b { font-size:18px; }
  #scr-over .stats small, #scr-over .stats .sub { font-size:11px; }
}
/* The official top bar gained a Save button: on phones keep it on one row by
   showing icons only for Save/News and letting the account name shrink. */
@media (max-width:1180px), (max-height:520px) {
  .topbar { flex-wrap:nowrap; }
  #btn-save > span, #btn-news > span { display:none; }
  .topbar > #user-pill { flex-shrink:1; }
}
/* Settings tabs scroll sideways on phones; keep the row from being squashed. */
#set-tabs { flex-shrink:0; padding-top:2px; padding-bottom:2px; }
/* Pok\xE9dex filters collapse behind a button on landscape phones. */
#ps-dex-filter { display:none; }
@media (max-height:520px) and (min-width:600px) {
  #ps-dex-filter { display:inline-flex; flex-shrink:0; align-items:center; min-height:26px; padding:2px 10px; font-size:12px; }
  #scr-dex:not(.ps-dex-open) #dex-filters, #scr-dex:not(.ps-dex-open) #dex-sort { display:none!important; }
  #scr-dex .dex-tools { flex-wrap:nowrap; }
  #scr-dex .dex-tools #dex-count { white-space:nowrap; }
  #scr-dex #dex-sort { flex-wrap:nowrap; overflow-x:auto; flex-shrink:0; scrollbar-width:none; margin:0 0 4px; }
  #scr-dex #dex-sort::-webkit-scrollbar { display:none; }
  #scr-dex #dex-sort .chip { flex-shrink:0; min-height:26px; padding:2px 8px; font-size:11px; }
  #dex-gens .gen-tab { min-height:32px; padding:2px 9px; }
}
.ps-lay-atk { border-color:rgba(255,138,107,.8); }
.ps-lay-atk .knob { background:rgba(255,107,74,.85); border-color:#8a1f10; }
#ps-lay-atk { justify-content:center; align-items:center; gap:6px; margin:6px 0 0; }

/* Online-only overrides; responsive layout is shared offline. */\r
`;
  document.head.appendChild(style);
  const psCssCompat = (() => {
    const supports = (p, v) => {
      try {
        return CSS.supports(p, v);
      } catch (_) {
        return false;
      }
    };
    const needDvh = !supports("height", "100dvh"), needInset = !supports("inset", "0px");
    const needed = needDvh || needInset;
    function rewrite(text) {
      if (needDvh) text = text.replace(/(\d*\.?\d+)(?:dvh|svh|lvh)\b/g, "$1vh").replace(/(\d*\.?\d+)(?:dvw|svw|lvw)\b/g, "$1vw");
      if (needInset) text = text.replace(/(^|[;{\s])inset\s*:\s*([^;}!]+)(!important)?/g, (m, pre, value, imp) => {
        const v = value.trim().split(/\s+/), [t, r = t, b = t, l = r] = v, i = imp ? " !important" : "";
        return `${pre}top:${t}${i};right:${r}${i};bottom:${b}${i};left:${l}${i}`;
      });
      return text;
    }
    function load(url) {
      return new Promise((resolve) => {
        try {
          const x = new XMLHttpRequest();
          x.open("GET", url);
          x.onload = () => resolve(x.status === 0 || x.status === 200 ? x.responseText : "");
          x.onerror = () => resolve("");
          x.send();
        } catch (_) {
          resolve("");
        }
      });
    }
    async function apply(ours) {
      if (!needed) return;
      ours.textContent = rewrite(ours.textContent);
      const links = [...document.querySelectorAll('link[rel="stylesheet"]')].filter((l) => {
        try {
          return new URL(l.href, location.href).origin === location.origin || location.protocol === "file:";
        } catch (_) {
          return false;
        }
      });
      const texts = await Promise.all(links.map((l) => load(l.href)));
      const absolute = (text, base) => text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => /^(data:|[a-z]+:|#)/i.test(u) ? m : 'url("' + new URL(u, base).href + '")');
      const css = texts.map((t, i) => rewrite(absolute(t, links[i].href))).join("\n");
      if (!css.trim()) return;
      const fixed = document.createElement("style");
      fixed.id = "ps-css-compat";
      fixed.textContent = css;
      ours.parentNode.insertBefore(fixed, ours);
    }
    try {
      const probe = document.createElement("div");
      probe.style.cssText = "display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden";
      probe.appendChild(document.createElement("div"));
      probe.appendChild(document.createElement("div"));
      document.body.appendChild(probe);
      const noGap = probe.scrollHeight !== 1;
      probe.remove();
      if (noGap) {
        document.documentElement.classList.add("ps-nogap");
        const s = document.createElement("style");
        s.id = "ps-nogap";
        s.textContent = ".ps-nogap .topbar>*,.ps-nogap .tabs>*,.ps-nogap .chips>*,.ps-nogap .row>*,.ps-nogap .seg>*,.ps-nogap #map-filters>*,.ps-nogap #map-options>*,.ps-nogap #ps-run-mode>*{margin:2px 3px}";
        document.head.appendChild(s);
      }
    } catch (_) {
    }
    return { needed, rewrite, apply };
  })();
  psCssCompat.apply(style);
  window.__psCssCompat = psCssCompat.needed;
  const host = document.createElement("div");
  host.innerHTML = '<section id="scr-map" class="scr dim hidden" role="dialog" aria-modal="true" aria-labelledby="map-title">\n  <div class="box map-box">\n    <div class="row between map-heading"><div><h2 id="map-title">Mapa de recursos</h2><p class="sub" id="map-status"></p></div><button id="map-close" class="btn small">Volver</button></div>\n    <div class="map-layout"><div class="map-view"><canvas id="resource-map" width="480" height="480" tabindex="0" aria-label="Mapa de recursos"></canvas><p id="map-selection" class="note" aria-live="polite"></p></div>\n    <div class="map-tools"><div class="row"><button class="btn small" id="map-out" aria-label="Alejar">\u2212</button><button class="btn small" id="map-in" aria-label="Acercar">+</button><button class="btn small" id="map-center">Centrar</button></div>\n    <h3>Recursos</h3><div id="map-filters" class="chips"></div><div id="map-options"></div>\n    <p class="note">Marcadores s\xF3lidos: zona cargada. Contornos: predicci\xF3n. Los recursos lejanos pueden haber cambiado.</p>\n    <p class="note">Arrastra para explorar \xB7 pellizca o usa +/\u2212 para ampliar \xB7 M / Esc para volver.</p>\n    <p class="note" id="map-session"></p></div></div>\n  </div>\n</section>\n';
  document.body.append(...host.childNodes);
  if (!document.querySelector('#set-tabs [data-t="map"]')) {
    const button = document.createElement("button");
    button.className = "gen-tab";
    button.dataset.t = "map";
    button.textContent = "Mapa";
    document.querySelector("#set-tabs").appendChild(button);
  }
  if (!document.getElementById("btn-pause-map")) {
    const button = document.createElement("button");
    button.id = "btn-pause-map";
    button.className = "btn";
    button.textContent = "Mapa \xB7 M";
    document.getElementById("btn-pause-settings").before(button);
  }
  G.Audio = (() => {
    const KEY = "ps.audio";
    let ctx = null, master, outNode, musicBus, sfxBus, reverb, wet;
    let settings = { music: 0.55, sfx: 0.7, muted: false };
    try {
      Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (e) {
    }
    let noiseBuf = null;
    let appActive = true, pageHidden = false, exiting = false;
    let playbackSerial = Promise.resolve();
    try {
      if (window.AndroidApp && typeof window.AndroidApp.isAppActive === "function") appActive = !!window.AndroidApp.isAppActive();
    } catch (_) {
    }
    const playbackBlocked = () => !appActive || pageHidden || document.hidden || exiting;
    function silenceOutput() {
      if (!ctx || !outNode || ctx.state === "closed") return;
      outNode.gain.cancelScheduledValues(ctx.currentTime);
      outNode.gain.setValueAtTime(0, ctx.currentTime);
    }
    function syncPlayback() {
      if (!ctx || ctx.state === "closed") return Promise.resolve();
      if (playbackBlocked()) silenceOutput();
      playbackSerial = playbackSerial.catch(() => {
      }).then(async () => {
        if (!ctx || ctx.state === "closed") return;
        if (playbackBlocked()) {
          silenceOutput();
          await ctx.suspend();
          return;
        }
        if (ctx.state !== "running") await ctx.resume();
        if (playbackBlocked()) {
          silenceOutput();
          await ctx.suspend();
        } else outNode.gain.setValueAtTime(0.9, ctx.currentTime);
      }).catch(() => {
      });
      return playbackSerial;
    }
    function setAppActive(active) {
      appActive = !!active;
      return syncPlayback();
    }
    function stopForExit() {
      exiting = true;
      wanted = null;
      stopCurrent();
      return syncPlayback();
    }
    document.addEventListener("visibilitychange", syncPlayback);
    addEventListener("pagehide", () => {
      pageHidden = true;
      return syncPlayback();
    });
    addEventListener("pageshow", () => {
      pageHidden = false;
      return syncPlayback();
    });
    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(settings));
      } catch (e) {
      }
    }
    function init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createDynamicsCompressor();
      master.threshold.value = -14;
      master.ratio.value = 4;
      const out = outNode = ctx.createGain();
      out.gain.value = 0.9;
      master.connect(out).connect(ctx.destination);
      musicBus = ctx.createGain();
      sfxBus = ctx.createGain();
      musicBus.connect(master);
      sfxBus.connect(master);
      reverb = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 1.8);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      let ch = 0;
      const fill = () => {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          const g = 1 - i / len;
          d[i] = (Math.random() * 2 - 1) * g * g * Math.sqrt(g);
        }
        if (++ch < 2) setTimeout(fill, 30);
        else reverb.buffer = ir;
      };
      setTimeout(fill, 300);
      wet = ctx.createGain();
      wet.gain.value = 0.3;
      reverb.connect(wet).connect(musicBus);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      applyVolumes();
      return true;
    }
    function unlock() {
      if (playbackBlocked() || !init()) return;
      syncPlayback();
      if (wanted && !current) startSong(wanted);
    }
    for (const ev of ["pointerdown", "pointerup", "touchend", "keydown"]) addEventListener(ev, unlock, { capture: true });
    function applyVolumes() {
      if (!ctx) return;
      const t = ctx.currentTime;
      musicBus.gain.setTargetAtTime(settings.muted ? 0 : settings.music * 0.7, t, 0.05);
      sfxBus.gain.setTargetAtTime(settings.muted ? 0 : settings.sfx * 2.4, t, 0.05);
    }
    function setVolume(which, v) {
      settings[which] = G.U.clamp(v, 0, 1);
      save();
      applyVolumes();
    }
    function toggleMute() {
      settings.muted = !settings.muted;
      save();
      applyVolumes();
      return settings.muted;
    }
    const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
    function osc(type, f, t, end, dest) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      o.connect(dest);
      o.start(t);
      o.stop(end + 0.05);
      return o;
    }
    function gainEnv(dest, t, a, peak, dur, rel, sus = 0.7) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.setTargetAtTime(peak * sus, t + a, Math.max(0.02, dur * 0.4));
      g.gain.setTargetAtTime(1e-4, t + dur, rel / 3);
      g.connect(dest);
      return g;
    }
    function noise(t, dur, dest) {
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf;
      s.connect(dest);
      s.start(t, Math.random() * 0.5);
      s.stop(t + dur + 0.05);
      return s;
    }
    function filt(type, f, q, dest) {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      b.connect(dest);
      return b;
    }
    function send(node, amount) {
      const s = ctx.createGain();
      s.gain.value = amount;
      node.connect(s).connect(reverb);
    }
    const INST = {
      flute(t, f, d, v, bus) {
        const lp = filt("lowpass", 3600, 0.5, bus);
        const g = gainEnv(lp, t, 0.045, 0.2 * v, d, 0.14, 0.82);
        send(g, 0.35);
        const o1 = osc("triangle", f, t, t + d + 0.3, g);
        const g2 = ctx.createGain();
        g2.gain.value = 0.18;
        g2.connect(g);
        const o2 = osc("sine", f * 2, t, t + d + 0.3, g2);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5.3;
        const lg = ctx.createGain();
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(f * 7e-3, t + Math.min(0.35, d));
        lfo.connect(lg);
        lg.connect(o1.frequency);
        lg.connect(o2.frequency);
        lfo.start(t);
        lfo.stop(t + d + 0.35);
        const bp = filt("bandpass", f * 2.2, 2, g);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.25, t);
        ng.gain.exponentialRampToValueAtTime(1e-3, t + 0.08);
        ng.connect(bp);
        noise(t, 0.09, ng);
      },
      bell(t, f, d, v, bus) {
        const g = ctx.createGain();
        g.connect(bus);
        send(g, 0.3);
        g.gain.setValueAtTime(1e-4, t);
        g.gain.linearRampToValueAtTime(0.22 * v, t + 4e-3);
        g.gain.exponentialRampToValueAtTime(8e-4, t + Math.min(d, 0.45) + 0.45);
        osc("sine", f, t, t + 1, g);
        const g2 = ctx.createGain();
        g2.connect(g);
        g2.gain.setValueAtTime(0.35, t);
        g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.09);
        osc("sine", f * 4, t, t + 0.12, g2);
      },
      pluck(t, f, d, v, bus) {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.Q.value = 2;
        lp.frequency.setValueAtTime(3200, t);
        lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.8), t + 0.22);
        const g = ctx.createGain();
        g.connect(bus);
        send(g, 0.2);
        g.gain.setValueAtTime(1e-4, t);
        g.gain.linearRampToValueAtTime(0.11 * v, t + 5e-3);
        g.gain.exponentialRampToValueAtTime(8e-4, t + Math.min(d, 0.35) + 0.25);
        lp.connect(g);
        osc("sawtooth", f, t, t + 0.7, lp);
      },
      bass(t, f, d, v, bus) {
        const lp = filt("lowpass", 900, 0.7, bus);
        const g = gainEnv(lp, t, 8e-3, 0.34 * v, d * 0.9, 0.08, 0.65);
        osc("triangle", f, t, t + d + 0.2, g);
        const g2 = ctx.createGain();
        g2.gain.value = 0.25;
        g2.connect(g);
        osc("square", f, t, t + d + 0.2, g2);
      },
      pad(t, f, d, v, bus) {
        const lp = filt("lowpass", 1100, 0.6, bus);
        const g = gainEnv(lp, t, 0.35, 0.05 * v, d, 0.7, 0.9);
        send(g, 0.5);
        osc("sawtooth", f * 1.004, t, t + d + 1, g);
        osc("sawtooth", f * 0.996, t, t + d + 1, g);
      },
      lead(t, f, d, v, bus) {
        const lp = filt("lowpass", 2600, 1, bus);
        const g = gainEnv(lp, t, 0.01, 0.075 * v, d, 0.08, 0.75);
        send(g, 0.2);
        const o1 = osc("square", f, t, t + d + 0.2, g);
        const o2 = osc("square", f * 1.006, t, t + d + 0.2, g);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 6;
        const lg = ctx.createGain();
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(f * 8e-3, t + 0.2);
        lfo.connect(lg);
        lg.connect(o1.frequency);
        lg.connect(o2.frequency);
        lfo.start(t);
        lfo.stop(t + d + 0.25);
      },
      kick(t, v, bus) {
        const g = ctx.createGain();
        g.connect(bus);
        g.gain.setValueAtTime(0.55 * v, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.22);
        const o = osc("sine", 150, t, t + 0.25, g);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
      },
      snare(t, v, bus) {
        const hp = filt("highpass", 1300, 0.7, bus);
        const g = ctx.createGain();
        g.connect(hp);
        send(g, 0.15);
        g.gain.setValueAtTime(0.22 * v, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.13);
        noise(t, 0.15, g);
        const g2 = ctx.createGain();
        g2.connect(bus);
        g2.gain.setValueAtTime(0.12 * v, t);
        g2.gain.exponentialRampToValueAtTime(1e-3, t + 0.08);
        osc("triangle", 190, t, t + 0.1, g2);
      },
      hat(t, v, bus) {
        const hp = filt("highpass", 7500, 0.7, bus);
        const g = ctx.createGain();
        g.connect(hp);
        g.gain.setValueAtTime(0.08 * v, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.045);
        noise(t, 0.05, g);
      },
      shaker(t, v, bus) {
        const bp = filt("bandpass", 5200, 1.2, bus);
        const g = ctx.createGain();
        g.connect(bp);
        g.gain.setValueAtTime(1e-4, t);
        g.gain.linearRampToValueAtTime(0.07 * v, t + 0.012);
        g.gain.exponentialRampToValueAtTime(1e-3, t + 0.07);
        noise(t, 0.08, g);
      }
    };
    const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    function midiOf(name) {
      const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
      if (!m) return null;
      return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    }
    function parseChord(c) {
      const m = /^([A-G])(#|b)?(m?)(?:\/([A-G])(#|b)?)?$/.exec(c);
      const pc = (l, a) => (NOTE[l] + (a === "#" ? 1 : a === "b" ? -1 : 0) + 12) % 12;
      const root = pc(m[1], m[2]);
      return { root, minor: m[3] === "m", bass: m[4] ? pc(m[4], m[5]) : root };
    }
    function compile(song) {
      const bars = song.bars || song.chords.length;
      const steps = bars * 16;
      const ev = Array.from({ length: steps }, () => []);
      for (const tr of song.melody || []) {
        tr.bars.forEach((bar, bi) => {
          let s = 0;
          for (const tok of bar.trim().split(/\s+/)) {
            const [n, len] = tok.split(":");
            const L = +len || 1;
            if (n !== "-") {
              const midi = midiOf(n) + (tr.shift || 0);
              ev[(bi * 16 + s) % steps].push({ inst: tr.inst, f: midiFreq(midi), len: L, v: tr.vel || 1 });
            }
            s += L;
          }
        });
      }
      const chords = song.chords.map(parseChord);
      const chordTone = (ch, i, base) => {
        const third = ch.minor ? 3 : 4;
        const iv = [0, third, 7, 12, 12 + third, 19][i] || 0;
        return base + ch.root + iv;
      };
      for (let b = 0; b < bars; b++) {
        const ch = chords[b % chords.length];
        for (const tr of song.parts || []) {
          const pat = tr.pattern;
          const base = 12 * (tr.octave + 1);
          for (let s = 0; s < 16; s++) {
            const c = pat[s];
            if (!c || c === "." || c === "-") continue;
            let len = 1;
            while (s + len < 16 && pat[s + len] === "-") len++;
            let midi;
            if (c === "R") midi = base + (tr.useBass ? ch.bass : ch.root);
            else if (c === "F") midi = base + ch.root + 7;
            else if (c === "O") midi = base + ch.root + 12;
            else if (c === "T") midi = base + ch.root + (ch.minor ? 3 : 4);
            else if (c === "C") {
              for (let i = 0; i < 3; i++) ev[b * 16 + s].push({ inst: tr.inst, f: midiFreq(chordTone(ch, i, base)), len, v: tr.vel || 1 });
              continue;
            } else midi = chordTone(ch, +c, base);
            ev[b * 16 + s].push({ inst: tr.inst, f: midiFreq(midi), len, v: tr.vel || 1 });
          }
        }
        for (const [inst, pat] of Object.entries(song.drums || {})) {
          for (let s = 0; s < 16; s++) {
            const c = pat[s];
            if (c && c !== ".") ev[b * 16 + s].push({ inst, drum: true, v: c === "X" ? 1 : c === "x" ? 0.75 : 0.45 });
          }
        }
      }
      return { steps, ev, bpm: song.bpm, swing: song.swing || 0 };
    }
    let wanted = null, current = null;
    const compiled = {};
    function startSong(name) {
      if (!ctx || !G.MUSIC[name]) return;
      const song = compiled[name] || (compiled[name] = compile(G.MUSIC[name]));
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(1e-4, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);
      bus.connect(musicBus);
      current = { name, song, bus, step: 0, next: ctx.currentTime + 0.1 };
    }
    function stopCurrent() {
      if (!current) return;
      const b = current.bus;
      b.gain.cancelScheduledValues(ctx.currentTime);
      b.gain.setValueAtTime(b.gain.value, ctx.currentTime);
      b.gain.linearRampToValueAtTime(1e-4, ctx.currentTime + 0.7);
      setTimeout(() => b.disconnect(), 900);
      current = null;
    }
    function music(name) {
      if (wanted === name) return;
      wanted = name;
      if (!ctx) return;
      stopCurrent();
      if (name) startSong(name);
    }
    setInterval(() => {
      if (!ctx || !current || playbackBlocked() || ctx.state !== "running") return;
      const c = current, sd = 60 / c.song.bpm / 4;
      while (c.next < ctx.currentTime + 0.15) {
        const i = c.step % c.song.steps;
        const t = c.next + (i % 4 === 2 ? c.song.swing * sd : 0);
        for (const e of c.song.ev[i]) {
          if (e.drum) INST[e.inst](t, e.v, c.bus);
          else INST[e.inst](t, e.f, e.len * sd, e.v, c.bus);
        }
        c.next += sd;
        c.step++;
      }
    }, 25);
    const last = {};
    let xpCombo = 0, xpT = 0, voices = 0;
    const SHOT_PITCH = {
      fire: 520,
      water: 700,
      electric: 1100,
      psychic: 800,
      grass: 640,
      ice: 900,
      poison: 400,
      ghost: 350,
      dragon: 300,
      fairy: 1200,
      normal: 600,
      fighting: 450,
      rock: 260,
      ground: 240,
      steel: 750,
      bug: 980,
      dark: 330,
      flying: 820
    };
    function tone(type, f0, f1, dur, vol, at = 0, bus = sfxBus) {
      const t = ctx.currentTime + at;
      const g = ctx.createGain();
      g.connect(bus);
      g.gain.setValueAtTime(1e-4, t);
      g.gain.linearRampToValueAtTime(vol, t + 6e-3);
      g.gain.exponentialRampToValueAtTime(5e-4, t + dur);
      const o = osc(type, f0, t, t + dur, g);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    }
    function hiss(dur, vol, type, f0, f1, at = 0, q = 1) {
      const t = ctx.currentTime + at;
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.Q.value = q;
      b.frequency.setValueAtTime(f0, t);
      if (f1) b.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      b.connect(g);
      g.connect(sfxBus);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(5e-4, t + dur);
      noise(t, dur, b);
    }
    function arp(type, freqs, gap, dur, vol) {
      freqs.forEach((f, i) => tone(type, f, f, dur, vol, i * gap));
    }
    const SFX = {
      hover: () => tone("square", 1400, 1400, 0.025, 0.025),
      click: () => {
        tone("square", 660, 990, 0.05, 0.06);
      },
      back: () => tone("square", 880, 520, 0.07, 0.05),
      confirm: () => arp("triangle", [784, 988, 1319], 0.05, 0.12, 0.09),
      select: () => tone("square", 990, 1180, 0.04, 0.045),
      error: () => arp("square", [330, 262], 0.08, 0.09, 0.05),
      shot(o) {
        const f = SHOT_PITCH[o.type] || 600;
        if (o.kind === "melee") hiss(0.12, 0.13, "bandpass", 600, 2800, 0, 1.4);
        else if (o.kind === "beam") {
          tone("sawtooth", f * 0.6, f * 0.35, 0.3, 0.05);
          hiss(0.25, 0.04, "bandpass", f * 2, f, 0, 3);
        } else if (o.kind === "nova") {
          hiss(0.2, 0.1, "lowpass", 2400, 300);
          tone("sine", 140, 60, 0.16, 0.12);
        } else if (o.kind === "aura") {
          tone("sine", f * 0.5, f * 0.55, 0.25, 0.04);
          tone("sine", f * 0.75, f * 0.8, 0.25, 0.03);
        } else if (o.kind === "buff") arp("sine", [f, f * 1.25, f * 1.5], 0.05, 0.12, 0.05);
        else if (o.kind === "orbit") tone("triangle", f, f * 1.5, 0.15, 0.04);
        else {
          tone("triangle", f * 1.5, f * 0.5, 0.09, 0.05);
          if (o.type === "fire" || o.type === "electric") hiss(0.06, 0.03, "highpass", 3e3);
        }
      },
      hit: () => tone("triangle", 230, 90, 0.045, 0.045),
      faint: () => tone("sine", 720, 240, 0.08, 0.04),
      bossDown() {
        hiss(0.7, 0.18, "lowpass", 1500, 100);
        arp("triangle", [262, 330, 392, 523], 0.09, 0.4, 0.08);
      },
      xp() {
        const now = ctx.currentTime;
        xpCombo = now - xpT < 0.45 ? Math.min(xpCombo + 1, 24) : 0;
        xpT = now;
        tone("sine", 880 * Math.pow(2, xpCombo / 12), 0, 0.06, 0.035);
      },
      coin: () => {
        tone("square", 1320, 1320, 0.05, 0.035);
        tone("square", 1760, 1760, 0.14, 0.035, 0.05);
      },
      heal: () => arp("triangle", [523, 659, 784, 1047], 0.06, 0.18, 0.06),
      levelup: () => {
        arp("square", [523, 659, 784, 1047], 0.07, 0.14, 0.05);
        arp("triangle", [1047, 1319, 1568], 0.07, 0.3, 0.05);
      },
      hurt: () => {
        tone("square", 150, 70, 0.14, 0.06);
        hiss(0.1, 0.06, "lowpass", 900);
      },
      boss: () => {
        [82, 123, 165].forEach((f) => tone("sawtooth", f, f * 0.98, 1.3, 0.05));
        INST.kick(ctx.currentTime, 1, sfxBus);
      },
      surge: () => hiss(0.7, 0.12, "lowpass", 500, 120),
      shiny: () => [2093, 2637, 3136, 2349, 3520, 4186].forEach((f, i) => INST.bell(ctx.currentTime + i * 0.07, f, 0.3, 0.8, sfxBus)),
      shinyGet() {
        SFX.shiny();
        arp("square", [784, 988, 1175, 1568], 0.1, 0.35, 0.05);
      },
      break: () => {
        hiss(0.16, 0.12, "lowpass", 1100, 200);
        tone("triangle", 140, 60, 0.12, 0.08);
      },
      chest: () => {
        SFX.break();
        arp("square", [1047, 1319, 1568, 2093], 0.06, 0.12, 0.04);
      },
      grass: () => hiss(0.06, 0.03, "highpass", 2600),
      ball: () => {
        tone("triangle", 220, 70, 0.12, 0.12);
        hiss(0.08, 0.06, "lowpass", 800);
      },
      shake: () => tone("square", 420, 380, 0.04, 0.05),
      burst(o) {
        hiss(0.5, 0.14, "bandpass", 400, 4e3, 0, 0.8);
        const r = o && o.rarity || 1;
        const chord = [[523, 659, 784], [587, 740, 880], [659, 831, 988], [698, 880, 1047], [784, 988, 1175, 1568]][r - 1];
        chord.forEach((f) => tone("triangle", f, f, 0.6 + r * 0.15, 0.04));
      },
      reveal(o) {
        INST.bell(ctx.currentTime, [523, 659, 784, 988, 1319][(o && o.rarity || 1) - 1], 0.3, 0.8, sfxBus);
      },
      rift: () => {
        [196, 233, 277, 330].forEach((f, i) => INST.pad(ctx.currentTime + i * 0.08, f, 1.4, 1.2, sfxBus));
        hiss(0.9, 0.08, "bandpass", 900, 300);
      },
      legend: () => {
        arp("square", [523, 659, 784, 1047, 1319, 1568], 0.08, 0.3, 0.05);
        SFX.shiny();
      },
      gameover: () => arp("triangle", [523, 440, 349, 262], 0.2, 0.35, 0.08),
      biome: () => [392, 494, 587, 784].forEach((f) => INST.pad(ctx.currentTime, f, 1.2, 1.4, sfxBus)),
      pause: () => arp("square", [784, 523], 0.06, 0.07, 0.04),
      buy: () => {
        SFX.coin();
        arp("triangle", [659, 784, 1047], 0.05, 0.12, 0.06);
      }
    };
    const MIN_GAP = { hit: 45, faint: 60, xp: 35, coin: 50, grass: 70, shot: 70, hover: 40, break: 60 };
    function sfx(name, opts) {
      if (!ctx || playbackBlocked() || settings.muted || settings.sfx <= 0 || ctx.state !== "running") return;
      const fn = SFX[name];
      if (!fn) return;
      const now = performance.now();
      const key = name === "shot" && opts ? "shot" + opts.kind : name;
      if (now - (last[key] || 0) < (MIN_GAP[name] || 0)) return;
      if (voices > 24) return;
      last[key] = now;
      voices++;
      setTimeout(() => voices--, 150);
      try {
        fn(opts);
      } catch (e) {
      }
    }
    function debugMeter(ms = 2e3) {
      if (!ctx) return Promise.resolve(null);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      master.connect(an);
      const buf = new Float32Array(an.fftSize);
      let peak = 0, sum = 0, n = 0;
      return new Promise((res) => {
        const t0 = performance.now();
        const id = setInterval(() => {
          an.getFloatTimeDomainData(buf);
          for (const v of buf) {
            const a = Math.abs(v);
            if (a > peak) peak = a;
            sum += v * v;
            n++;
          }
          if (performance.now() - t0 > ms) {
            clearInterval(id);
            master.disconnect(an);
            res({ peak: +peak.toFixed(3), rms: +Math.sqrt(sum / n).toFixed(4) });
          }
        }, 40);
      });
    }
    function debugStream(solo = false) {
      if (!ctx) return null;
      const d = ctx.createMediaStreamDestination();
      outNode.connect(d);
      if (solo) {
        try {
          outNode.disconnect(ctx.destination);
        } catch (e) {
        }
      }
      return d.stream;
    }
    return {
      music,
      sfx,
      setVolume,
      toggleMute,
      unlock,
      debugMeter,
      debugStream,
      setAppActive,
      stopForExit,
      /** ¿Ya puede sonar? (el navegador sólo deja tras tocar algo, salvo excepciones) */
      canPlay() {
        return !!ctx && !playbackBlocked() && ctx.state === "running";
      },
      get settings() {
        return settings;
      },
      get running() {
        return !!ctx && !playbackBlocked() && ctx.state === "running";
      },
      get track() {
        return current && current.name;
      }
    };
  })();
  ;
  G.MapUI = /* @__PURE__ */ (() => {
    const $ = (id) => document.getElementById(id);
    const types = {
      chest: ["Cofre peque\xF1o", "#ffd23f"],
      bigchest: ["Cofre grande", "#c47bff"],
      altar: ["Altar", "#bd9cff"],
      spring: ["Manantial", "#74eed3"],
      trap: ["Trampa", "#fa8b91"],
      rock: ["Roca", "#a8b7c3"],
      tree: ["\xC1rbol", "#4bc983"]
    };
    const tr = (s) => G.T(s);
    const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    let opened = false, pauseToken = null, previousFocus = null, pan = { x: 0, y: 0 }, range = 96;
    let mini = null, miniAt = 0, sample = null, plotted = [], drag = null;
    const pointers = /* @__PURE__ */ new Map();
    const filters = () => new Set(G.Settings.get("mapFilters") || ["chest", "bigchest", "altar", "spring"]);
    const active = () => G.Game.player && ["playing", "paused", "held"].includes(G.Game.state);
    function symbol(ctx, type, x, y, scale = 1, predicted = false) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#08142a";
      const box = (x2, y2, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x2, y2, w, h);
        ctx.strokeRect(x2, y2, w, h);
      };
      if (predicted) {
        ctx.strokeStyle = "#e4efff";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "#08142a";
        ctx.globalAlpha = 0.8;
      }
      if (type === "chest" || type === "bigchest") {
        const big = type === "bigchest", w = big ? 13 : 11;
        box(-w / 2, -4, w, 9, big ? "#ba7fff" : "#ffc449");
        ctx.beginPath();
        ctx.moveTo(-w / 2, -1);
        ctx.lineTo(w / 2, -1);
        ctx.stroke();
        if (big) {
          ctx.strokeStyle = "#fff09a";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, -1.5, 2, -Math.PI, 0);
          ctx.stroke();
          box(-2, 0, 4, 3, "#ffe787");
        } else box(-1, -1, 2, 3, "#fff3b0");
      } else if (type === "altar") {
        ctx.fillStyle = "#d4a7ff";
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, -1);
        ctx.lineTo(0, 4);
        ctx.lineTo(-5, -1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        box(-4, 4, 8, 2, "#a582d9");
        ctx.fillStyle = "#fff4ff";
        ctx.fillRect(-1, -4, 2, 4);
      } else if (type === "spring") {
        ctx.fillStyle = "#62f4e5";
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.bezierCurveTo(-1, -4, -6, 0, -5, 3);
        ctx.bezierCurveTo(-4, 8, 4, 8, 5, 3);
        ctx.bezierCurveTo(6, 0, 1, -4, 0, -7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.fillRect(-3, 1, 6, 2);
        ctx.fillRect(-1, -1, 2, 6);
      } else if (type === "trap") {
        ctx.fillStyle = "#ff8d9c";
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(7, 6);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#251222";
        ctx.fillRect(-1, -3, 2, 5);
        ctx.fillRect(-1, 3, 2, 2);
      } else if (type === "tree") {
        box(-1, 2, 2, 5, "#b08052");
        ctx.fillStyle = "#5cda79";
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(6, 3);
        ctx.lineTo(-6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (type === "rock") {
        ctx.fillStyle = "#acb5c5";
        ctx.beginPath();
        ctx.moveTo(-6, 4);
        ctx.lineTo(-4, -3);
        ctx.lineTo(2, -5);
        ctx.lineTo(6, 0);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (type === "player") {
        ctx.fillStyle = "#ffe16d";
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (type === "ally") {
        ctx.fillStyle = "#7fff9d";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#12352b";
        ctx.fillRect(-1, -3, 2, 6);
        ctx.fillRect(-3, -1, 6, 2);
      } else if (type === "rift") {
        ctx.fillStyle = "#512779";
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f3b8ff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.fillRect(-1, -4, 2, 5);
      }
      ctx.restore();
    }
    function legendIcons() {
      for (const cv of document.querySelectorAll("#map-filters canvas, #map-legend canvas")) {
        cv.width = cv.height = 40;
        symbol(cv.getContext("2d"), cv.dataset.symbol, 20, 20, 1.8, cv.dataset.predicted === "1");
      }
    }
    function settingsHTML() {
      const toggle = (key, label, sub) => `<div class="set-row"><div class="grow"><b>${escape(tr(label))}</b><small>${escape(tr(sub))}</small></div><button class="btn small switch ${G.Settings.get(key) ? "gold" : ""}" data-k="${key}">${escape(tr(G.Settings.get(key) ? "S\xED" : "No"))}</button></div>`;
      return `<h3 class="set-h">${escape(tr("Mapa de recursos"))}</h3>` + toggle("minimap", "Minimapa de combate", "Toca el minimapa o pulsa M para abrir el mapa.") + toggle("mapPredict", "Mostrar predicciones", "Contornos: recursos a\xFAn no cargados; pueden haber cambiado.") + toggle("mapTerrain", "Mostrar terreno", "Suelo, paredes y agua.") + `<p class="note">${escape(tr("Los filtros y el zoom se guardan en este dispositivo."))}</p>`;
    }
    function syncControls() {
      var _a, _b;
      const selected = filters();
      $("map-filters").innerHTML = Object.entries(types).map(([key, [name]]) => `<button class="chip ${selected.has(key) ? "on" : ""}" data-resource="${key}" aria-pressed="${selected.has(key)}"><canvas data-symbol="${key}" aria-hidden="true"></canvas>${escape(tr(name))}</button>`).join("");
      $("map-options").innerHTML = ["mapPredict", "mapTerrain"].map((key, i) => `<button class="btn small ${G.Settings.get(key) ? "gold" : ""}" data-option="${key}" aria-pressed="${!!G.Settings.get(key)}">${escape(tr(i ? "Mostrar terreno" : "Mostrar predicciones"))}: ${escape(tr(G.Settings.get(key) ? "S\xED" : "No"))}</button>`).join("");
      $("map-legend").innerHTML = [["player", "Tu posici\xF3n"], ["ally", "Aliado en el mapa"], ["rift", "Entrada de grieta"], ["chest", "Recurso previsto"]].map(([key, label], i) => `<span><canvas data-symbol="${key}" data-predicted="${i === 3 ? 1 : 0}" aria-hidden="true"></canvas>${escape(tr(label))}</span>`).join("") + `<p>${escape(tr("Verde: suelo \xB7 gris: paredes \xB7 azul: agua"))}</p>`;
      legendIcons();
      if (G.World.mapExplorationOnly) {
        (_a = $("map-options").querySelector('[data-option="mapPredict"]')) == null ? void 0 : _a.remove();
        (_b = $("map-legend").querySelector('[data-predicted="1"]')) == null ? void 0 : _b.parentElement.remove();
        const note = $("scr-map").querySelector(".map-tools > p.note");
        if (note) note.textContent = "\u5730\u56FE\u8BB0\u5F55\u5DF2\u63A2\u7D22\u533A\u57DF\uFF1B\u6DF1\u8272\u4E3A\u672A\u63A2\u7D22\u533A\u57DF\u3002\u8D44\u6E90\u72B6\u6001\u4EE5\u6700\u8FD1\u4E00\u6B21\u63A2\u7D22\u65F6\u4E3A\u51C6\u3002";
      }
    }
    function init() {
      const legend = document.createElement("div");
      legend.id = "map-legend";
      $("map-options").after(legend);
      $("map-title").after($("map-session"));
      $("map-session").classList.add("map-pause-status");
      $("btn-pause-map").onclick = open2;
      $("map-close").onclick = close;
      $("map-out").onclick = () => zoom(1.25);
      $("map-in").onclick = () => zoom(0.8);
      $("map-center").onclick = () => {
        pan = { x: 0, y: 0 };
        clearSelection();
        render();
      };
      $("map-filters").onclick = (e) => {
        var _a;
        const key = (_a = e.target.closest("[data-resource]")) == null ? void 0 : _a.dataset.resource;
        if (!key) return;
        const selected = filters();
        selected.has(key) ? selected.delete(key) : selected.add(key);
        G.Settings.set("mapFilters", [...selected]);
      };
      $("map-options").onclick = (e) => {
        var _a;
        const key = (_a = e.target.closest("[data-option]")) == null ? void 0 : _a.dataset.option;
        if (key) G.Settings.set(key, !G.Settings.get(key));
      };
      G.Settings.on(() => {
        miniAt = 0;
        if (isOpen()) {
          syncControls();
          render();
        }
      });
      addEventListener("keydown", keydown, true);
      addEventListener("resize", () => {
        miniAt = 0;
        if (isOpen()) render();
      });
      const canvas = $("resource-map");
      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15);
      }, { passive: false });
      canvas.addEventListener("pointerdown", (e) => {
        if (e.button && e.pointerType === "mouse") return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        drag = { x: e.clientX, y: e.clientY, moved: false };
      });
      canvas.addEventListener("pointermove", (e) => {
        var _a;
        const old = pointers.get(e.pointerId);
        if (!old) return;
        const other = (_a = [...pointers.entries()].find(([id]) => id !== e.pointerId)) == null ? void 0 : _a[1];
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (other) {
          const before = Math.hypot(old.x - other.x, old.y - other.y), after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
          if (before > 5 && after > 5) zoom(before / after);
          drag.moved = true;
        } else {
          const scale = range / canvas.getBoundingClientRect().width;
          pan.x = G.U.clamp(pan.x - (e.clientX - old.x) * scale, -8192, 8192);
          pan.y = G.U.clamp(pan.y - (e.clientY - old.y) * scale, -8192, 8192);
          if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.moved = true;
          render();
        }
      });
      function end(e) {
        if (!pointers.has(e.pointerId)) return;
        const click = e.type === "pointerup" && !(drag == null ? void 0 : drag.moved) && pointers.size === 1;
        pointers.delete(e.pointerId);
        if (click) select(e);
        if (!pointers.size) drag = null;
      }
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(name, end);
      setInterval(() => {
        if (isOpen()) render();
        else if (opened) close();
      }, 300);
    }
    function isOpen() {
      return opened && !$("scr-map").classList.contains("hidden");
    }
    function open2() {
      var _a;
      if (!active() || isOpen() || ((_a = G.Judgment) == null ? void 0 : _a.cinematic)) return;
      if (document.querySelector("#scr-settings:not(.hidden), #scr-levelup:not(.hidden), #scr-item:not(.hidden), #scr-bond:not(.hidden)")) return;
      previousFocus = document.activeElement;
      G.Input.reset();
      G.Touch.reset();
      pan = { x: 0, y: 0 };
      range = Number(G.Settings.get("mapRange")) || 96;
      range = G.U.clamp(range, 24, 160);
      opened = true;
      $("scr-map").classList.remove("hidden");
      pauseToken = G.Game.pauseForMap();
      clearSelection();
      syncControls();
      render();
      $("map-close").focus();
    }
    function close() {
      opened = false;
      $("scr-map").classList.add("hidden");
      pointers.clear();
      drag = null;
      G.Input.reset();
      G.Touch.reset();
      if (pauseToken) G.Game.resumeFromMap(pauseToken);
      pauseToken = null;
      if ((previousFocus == null ? void 0 : previousFocus.isConnected) && previousFocus.getClientRects().length) previousFocus.focus();
    }
    function keydown(e) {
      var _a, _b;
      const editing = (_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, 'input,textarea,select,[contenteditable="true"]');
      if (editing || e.ctrlKey || e.altKey || e.metaKey) return;
      const mapKey = e.code === "KeyM";
      if (!isOpen()) {
        if (mapKey && !e.repeat && active()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          open2();
        }
        return;
      }
      if (e.key === "Tab") {
        const focusable = [...$("scr-map").querySelectorAll('button, [tabindex="0"]')];
        const index = focusable.indexOf(document.activeElement);
        const next = (index + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
        e.preventDefault();
        e.stopImmediatePropagation();
        focusable[next].focus();
        return;
      }
      if (mapKey || e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) close();
        return;
      }
      if (["+", "=", "-", "Home", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === "+" || e.key === "=") zoom(0.8);
        else if (e.key === "-") zoom(1.25);
        else if (e.key === "Home") {
          pan = { x: 0, y: 0 };
          render();
        } else {
          const step = range / 8;
          pan.x += e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          pan.y += e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          render();
        }
      } else if (!["Enter", " "].includes(e.key)) {
        e.stopImmediatePropagation();
      }
    }
    function zoom(factor) {
      range = G.U.clamp(Math.round(range * factor), 24, 160);
      G.Settings.set("mapRange", range);
      clearSelection();
      render();
    }
    function clearSelection() {
      $("map-selection").textContent = tr("Selecciona un recurso para ver su distancia.");
    }
    function snapshot(cx, cy, span) {
      const startX = Math.floor(cx - span / 2), startY = Math.floor(cy - span / 2);
      return G.World.mapSample(startX, startY, span, span, !!G.Settings.get("mapPredict"));
    }
    function paint(ctx, size, s, pl, compact, displaySize = size) {
      const k = size / s.cols, selected = filters(), output = [];
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#0b1838";
      ctx.fillRect(0, 0, size, size);
      if (G.Settings.get("mapTerrain")) {
        const liquid = { water: "#376a9c", swamp: "#42695d", lava: "#ac5036", poison: "#80558b", spark: "#9a873e", ice: "#7b9bb1" }[G.World.liquidKind()] || "#376a9c";
        const palette = ["#42654d", "#737b91", liquid, "#0b1838"];
        ctx.globalAlpha = compact ? 0.8 : 0.9;
        for (let y = 0; y < s.rows; y++) for (let x = 0; x < s.cols; x++) {
          ctx.fillStyle = palette[s.terrain[y * s.cols + x]];
          ctx.fillRect(x * k, y * k, Math.ceil(k), Math.ceil(k));
        }
        ctx.globalAlpha = 1;
      }
      const point = (x, y) => [(x / 32 - s.tx0) * k, (y / 32 - s.ty0) * k];
      const occupied = [], priority = { bigchest: 7, spring: 6, altar: 5, chest: 4, trap: 3, rock: 2, tree: 1 };
      const ordered = compact ? [...s.props].sort((a, b) => Number(a.predicted) - Number(b.predicted) || (priority[b.type] || 0) - (priority[a.type] || 0)) : s.props;
      const markerScale = compact ? size / displaySize * 0.8 : 1.05;
      for (const p of ordered) {
        if (!selected.has(p.type)) continue;
        const x = (p.tx + 0.5 - s.tx0) * k, y = (p.ty + 0.5 - s.ty0) * k;
        if (compact && occupied.some((q) => Math.hypot(q.x - x, q.y - y) < 14 * markerScale)) continue;
        if (compact) occupied.push({ x, y });
        symbol(ctx, p.type, x, y, markerScale, p.predicted);
        output.push({ ...p, sx: x, sy: y });
      }
      const marker = (x, y, type) => {
        const [px2, py2] = point(x, y);
        if (px2 < 0 || py2 < 0 || px2 > size || py2 > size) return;
        symbol(ctx, type, px2, py2, markerScale);
      };
      if (G.Coop.active) for (const member of G.Coop.puppets()) marker(member.x, member.y, "ally");
      const rift = G.Rift.rift;
      if (rift) marker(rift.x, rift.y, "rift");
      const [px, py] = point(pl.x, pl.y);
      if (px >= 0 && py >= 0 && px <= size && py <= size) symbol(ctx, "player", px, py, markerScale);
      return output;
    }
    function render() {
      if (!isOpen()) return;
      if (!active()) {
        close();
        return;
      }
      const pl = G.Game.player, cv = $("resource-map");
      $("map-session").textContent = tr((pauseToken == null ? void 0 : pauseToken.coop) && G.Game.state === "playing" ? "Solicitando pausa al grupo\u2026" : "Partida en pausa.");
      const px = Math.min(800, Math.max(240, Math.round(cv.getBoundingClientRect().width * Math.min(1.5, devicePixelRatio || 1)))) || 480;
      if (cv.width !== px) {
        cv.width = cv.height = px;
      }
      sample = snapshot(pl.x / 32 + pan.x, pl.y / 32 + pan.y, range);
      const ctx = cv.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      plotted = paint(ctx, px, sample, pl, false);
      $("map-status").textContent = tr(G.World.biomeName()) + " \xB7 " + range + " \xD7 " + range + " " + tr("casillas");
      const actual = plotted.filter((p) => !p.predicted).length;
      $("map-status").textContent += " \xB7 " + actual + " " + tr("confirmados") + " / " + (plotted.length - actual) + " " + tr("predichos");
    }
    function select(e) {
      if (!sample) return;
      const cv = $("resource-map"), rect = cv.getBoundingClientRect(), x = (e.clientX - rect.left) / rect.width * cv.width, y = (e.clientY - rect.top) / rect.height * cv.height;
      const nearest = plotted.reduce((a, p2) => {
        var _a, _b;
        return Math.hypot(p2.sx - x, p2.sy - y) < Math.hypot(((_a = a == null ? void 0 : a.sx) != null ? _a : Infinity) - x, ((_b = a == null ? void 0 : a.sy) != null ? _b : Infinity) - y) ? p2 : a;
      }, null);
      if (!nearest || Math.hypot(nearest.sx - x, nearest.sy - y) > Math.max(14, cv.width / rect.width * 16)) {
        clearSelection();
        return;
      }
      const p = G.Game.player, dist = Math.round(Math.hypot((nearest.tx + 0.5) * 32 - p.x, (nearest.ty + 0.5) * 32 - p.y) / 32);
      $("map-selection").textContent = tr(types[nearest.type][0]) + " \xB7 (" + nearest.tx + ", " + nearest.ty + ") \xB7 " + dist + " " + tr("casillas") + " \xB7 " + tr(nearest.predicted ? "Predicci\xF3n" : "Confirmado");
    }
    function drawHUD(ctx, w, h, pl) {
      if (!G.Settings.get("minimap") || isOpen() || h < 270) return;
      const size = h < 340 ? 84 : h < 420 ? 96 : 112, sa = G.Touch.safeArea();
      const x = w - size - 16 - sa.right, y = 66 + sa.top;
      const now = performance.now();
      if (!mini) mini = document.createElement("canvas");
      if (!miniAt || now - miniAt > 350) {
        mini.width = mini.height = 144;
        const s = snapshot(pl.x / 32, pl.y / 32, 64);
        paint(mini.getContext("2d"), 144, s, pl, true, size);
        miniAt = now;
      }
      ctx.save();
      ctx.fillStyle = "rgba(26,49,112,.85)";
      ctx.strokeStyle = "#f4f8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - 3, y - 3, size + 6, size + 24, 7);
      else ctx.rect(x - 3, y - 3, size + 6, size + 24);
      ctx.fill();
      ctx.stroke();
      ctx.drawImage(mini, x, y, size, size);
      ctx.font = "700 10px Pixelify,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd23f";
      ctx.fillText(tr("Mapa") + " \xB7 M", x + size / 2, y + size + 14);
      ctx.restore();
      G.Touch.addButton(x - 3, y - 3, size + 6, size + 24, open2, 0);
    }
    return { init, open: open2, close, drawHUD, settingsHTML, get isOpen() {
      return isOpen();
    } };
  })();
  ;
  (() => {
    const game = G.Game, world = G.World, hud = G.HUD;
    const terrain = /* @__PURE__ */ new Map(), props = /* @__PURE__ */ new Map(), gone = /* @__PURE__ */ new Set(), predicted = /* @__PURE__ */ new Map();
    let sampledAt = 0, seed = 1;
    const clear = () => {
      terrain.clear();
      props.clear();
      gone.clear();
      predicted.clear();
      sampledAt = 0;
    };
    const reset = world.reset;
    world.reset = function(s, ...rest) {
      seed = s | 0 || 1;
      clear();
      return reset.call(this, s, ...rest);
    };
    for (const key of ["setBiome", "setArena"]) {
      const original = world[key];
      world[key] = function(...args) {
        if (key === "setArena") predicted.clear();
        return original.apply(this, args);
      };
    }
    const N = 16, H = (x, y, s) => G.U.hash(x, y, s);
    const vnoise = (x, y, s) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = H(xi, yi, s), b = H(xi + 1, yi, s), c = H(xi, yi + 1, s), d = H(xi + 1, yi + 1, s);
      return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
    };
    const fbm = (x, y, s) => vnoise(x, y, s) * 0.65 + vnoise(x * 2.13 + 17, y * 2.13 - 9, s + 1) * 0.35;
    const arenaOf = () => {
      const a = world.arena;
      return a && a.th ? a : null;
    };
    const arenaDist = (a, tx, ty) => a ? Math.hypot(tx - a.tx, ty - a.ty) : Infinity;
    const arenaSafe = (a, tx, ty) => {
      const lx = tx - a.tx, ly = ty - a.ty;
      return Math.abs(lx) <= 2 && ly >= -6 && ly <= 5 || Math.hypot(lx, ly) < 2.5;
    };
    function terrainRaw(tx, ty, a = arenaOf()) {
      const ad = arenaDist(a, tx, ty);
      if (a && ad < a.r + 7) {
        if (ad >= a.r) return 1;
        if (arenaSafe(a, tx, ty)) return 0;
        const th = a.th;
        if (th.pillars && ad < a.r - 2 && H(tx >> 1, ty >> 1, seed + 31 + a.tx) < th.pillars) return 1;
        if (th.pools && ad < a.r - 1.5 && fbm(tx / 3.2, ty / 3.2, seed + 37 + a.tx) < th.pools) return 2;
        return 0;
      }
      const d = Math.hypot(tx, ty);
      if (d < 9) return 0;
      const ramp = Math.min(1, Math.max(0, (d - 9) / 8));
      if (fbm(tx / 13, ty / 13, seed + 101) < 0.04 + 0.23 * ramp) return 2;
      if (fbm(tx / 8, ty / 8, seed + 202) > 1 - 0.27 * ramp) return 1;
      return 0;
    }
    function propSpec(tx, ty, a = arenaOf()) {
      if (terrainRaw(tx, ty, a) !== 0 || Math.hypot(tx, ty) < 7) return null;
      let open2 = true;
      for (let b = -1; b <= 1 && open2; b++) for (let c = -1; c <= 1; c++) if (terrainRaw(tx + c, ty + b, a) !== 0) {
        open2 = false;
        break;
      }
      if (a && arenaDist(a, tx, ty) < a.r + 9) return null;
      const h = H(tx, ty, seed + 404), grove = fbm(tx / 10, ty / 10, seed + 505) > 0.6, hs = H(tx, ty, seed + 909);
      if (open2 && Math.hypot(tx, ty) > 12 && hs < 32e-4) {
        const type = hs < 4e-4 ? "altar" : hs < 8e-4 ? "spring" : hs < 11e-4 ? "bigchest" : "trap";
        return { type, kind: Math.floor(H(tx, ty, seed + 910) * (type === "altar" ? 4 : 3)) };
      }
      if (open2 && h < (grove ? 0.07 : 6e-3)) return { type: "tree", kind: 0 };
      if (open2 && h > 0.992) return { type: "rock", kind: 0 };
      if (open2 && h > 0.985 && h <= 0.992 && H(tx, ty, seed + 606) < 0.07) return { type: "chest", kind: 0 };
      return null;
    }
    try {
      if (!localStorage.getItem("ps.mapPredictRestored")) {
        G.Settings.set("mapPredict", true);
        localStorage.setItem("ps.mapPredictRestored", "1");
      }
    } catch (_) {
    }
    world.mapPredictTerrain = terrainRaw;
    world.mapPredictProp = propSpec;
    const visible = world.visibleProps;
    world.visibleProps = function(cam) {
      var _a;
      const result = visible.apply(this, arguments);
      if (game.player && ["playing", "paused", "held"].includes(game.state) && performance.now() - sampledAt > 300) {
        sampledAt = performance.now();
        const x0 = Math.floor(cam.left() / 32), y0 = Math.floor(cam.top() / 32);
        const x1 = Math.ceil((cam.left() + cam.w) / 32), y1 = Math.ceil((cam.top() + cam.h) / 32);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) terrain.set(x + "," + y, (_a = { floor: 0, wall: 1, liquid: 2 }[world.kindAt(x * 32 + 16, y * 32 + 16)]) != null ? _a : 3);
        const alive = /* @__PURE__ */ new Set();
        for (const p of result) if (p.hp > 0 && !p.used && p.type !== "grass") alive.add(p.tx + "," + p.ty);
        for (let y = y0 + 1; y < y1 - 1; y++) for (let x = x0 + 1; x < x1 - 1; x++) {
          const key = x + "," + y;
          if (!alive.has(key) && (props.has(key) || propSpec(x, y))) {
            props.delete(key);
            gone.add(key);
          }
        }
        for (const p of result) {
          if (p.hp <= 0 || p.used || p.type === "grass") continue;
          const key = p.tx + "," + p.ty;
          gone.delete(key);
          props.set(key, { type: p.type, tx: p.tx, ty: p.ty, x: p.x, y: p.y, charge: p.charge, predicted: false });
        }
        while (terrain.size > 1e5) terrain.delete(terrain.keys().next().value);
        while (props.size > 12e3) props.delete(props.keys().next().value);
        while (gone.size > 2e4) gone.delete(gone.values().next().value);
      }
      return result;
    };
    world.mapSample = function(tx0, ty0, cols, rows, predict = true) {
      cols = Math.max(1, Math.min(160, cols | 0));
      rows = Math.max(1, Math.min(160, rows | 0));
      const values = new Uint8Array(cols * rows).fill(3), found = [], a = arenaOf();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const tx = tx0 + x, ty = ty0 + y, key = tx + "," + ty, seen = terrain.get(key);
        if (seen !== void 0 && !predict) {
          values[y * cols + x] = seen;
          continue;
        }
        if (!predict) continue;
        let v = predicted.get(key);
        if (!v) {
          v = { terrain: terrainRaw(tx, ty, a), spec: propSpec(tx, ty, a) };
          if (predicted.size > 1e5) predicted.clear();
          predicted.set(key, v);
        }
        values[y * cols + x] = seen != null ? seen : v.terrain;
        if (v.spec && !props.has(key) && !gone.has(key)) found.push({ ...v.spec, tx, ty, predicted: true });
      }
      for (const p of props.values()) if (p.tx >= tx0 && p.tx < tx0 + cols && p.ty >= ty0 && p.ty < ty0 + rows) found.push({ ...p });
      return { terrain: values, props: found, tx0, ty0, cols, rows, seed };
    };
    const originalSafe = G.Touch.safeArea;
    G.Touch.safeArea = function() {
      var _a, _b;
      const safe = { ...originalSafe.call(this) };
      try {
        const v = (_b = (_a = window.AndroidApp) == null ? void 0 : _a.getCutoutInsets) == null ? void 0 : _b.call(_a).split(",").map(Number);
        if ((v == null ? void 0 : v.length) === 5 && v.every(Number.isFinite) && v[4] > 0) for (const [i, key] of ["left", "top", "right", "bottom"].entries()) safe[key] = Math.max(safe[key], Math.min((i % 2 ? innerHeight : innerWidth) / 2, Math.max(0, v[i]) / v[4]));
      } catch (_) {
      }
      for (const key of ["left", "top", "right", "bottom"]) document.documentElement.style.setProperty("--ps-safe-" + key, safe[key] + "px");
      document.documentElement.style.setProperty("--ps-vh", innerHeight + "px");
      return safe;
    };
    G.Touch.safeArea();
    setInterval(() => G.Touch.safeArea(), 500);
    if (!G.Input.reset) G.Input.reset = function() {
      dispatchEvent(new Event("blur"));
      G.Input.endFrame();
    };
    game.pauseForMap = function() {
      const token = { coop: G.Coop.active, resume: game.state === "playing" };
      G.Input.reset();
      G.Touch.reset();
      if (token.coop) G.Coop.holdStart();
      else if (token.resume) {
        game.togglePause();
        G.UI.hide("scr-pause");
      }
      return token;
    };
    game.resumeFromMap = function(token) {
      G.Input.reset();
      G.Touch.reset();
      if (token == null ? void 0 : token.coop) {
        G.Coop.holdEnd();
        return;
      }
      if ((token == null ? void 0 : token.resume) && game.state === "paused") game.togglePause();
    };
    const draw = hud.draw;
    hud.draw = function(ctx, w, h, player, ...args) {
      var _a;
      const result = draw.call(this, ctx, w, h, player, ...args);
      if (player && !((_a = G.Judgment) == null ? void 0 : _a.cinematic)) G.MapUI.drawHUD(ctx, w, h, player);
      return result;
    };
  })();
  ;
  (() => {
    const judgment = G.Judgment;
    if (!judgment || typeof judgment.update !== "function") return;
    const KEY = "ps.runMode", officialAt = Number(judgment.AT) || 1800;
    const TEXT = {
      zh: { arceus: "\u963F\u5C14\u5B99\u65AF\u6A21\u5F0F", endless: "\u65E0\u5C3D\u6A21\u5F0F", arceusSub: "\u7B2C 30 \u5206\u949F\u964D\u4E34\u963F\u5C14\u5B99\u65AF\u5BA1\u5224", endlessSub: "\u4E0D\u89E6\u53D1\u963F\u5C14\u5B99\u65AF\uFF0C\u53EF\u4E00\u76F4\u73A9\u4E0B\u53BB", title: "\u5F00\u5C40\u6A21\u5F0F\uFF08\u8054\u673A\u4EE5\u623F\u4E3B\u4E3A\u51C6\uFF09" },
      en: { arceus: "Arceus mode", endless: "Endless mode", arceusSub: "Judgment of Arceus at minute 30", endlessSub: "No Arceus, play as long as you last", title: "Run mode (host decides in co-op)" },
      es: { arceus: "Modo Arceus", endless: "Modo infinito", arceusSub: "Sentencia de Arceus en el minuto 30", endlessSub: "Sin Arceus, aguanta lo que puedas", title: "Modo de partida (en grupo decide el anfitri\xF3n)" }
    };
    const mode = () => {
      try {
        return localStorage.getItem(KEY) === "endless" ? "endless" : "arceus";
      } catch (_) {
        return "arceus";
      }
    };
    const text = () => {
      var _a;
      const l = String(((_a = G.I18n) == null ? void 0 : _a.lang) || "");
      return /^zh/.test(l) ? TEXT.zh : l === "es" ? TEXT.es : TEXT.en;
    };
    let endless = false;
    const reset = judgment.reset;
    judgment.reset = function(...args) {
      endless = mode() === "endless";
      judgment.AT = endless ? Infinity : officialAt;
      return reset.apply(this, args);
    };
    const update = judgment.update;
    judgment.update = function(dt, player, time, ...rest) {
      if (endless && !judgment.active && !judgment.cinematic && time >= officialAt - 1) time = officialAt - 1;
      return update.call(this, dt, player, time, ...rest);
    };
    G.RunMode = { get: mode, set(value) {
      try {
        localStorage.setItem(KEY, value === "endless" ? "endless" : "arceus");
      } catch (_) {
      }
      render();
    }, get endless() {
      return endless;
    } };
    function render() {
      const play = document.querySelector('#scr-menu [data-go="play"]');
      if (!play) return;
      let box = document.getElementById("ps-run-mode");
      if (!box) {
        box = document.createElement("div");
        box.id = "ps-run-mode";
        box.setAttribute("translate", "no");
        box.innerHTML = '<button type="button" data-mode="arceus"></button><button type="button" data-mode="endless"></button>';
        box.addEventListener("click", (event) => {
          const button = event.target.closest("button[data-mode]");
          if (!button) return;
          G.RunMode.set(button.dataset.mode);
          try {
            G.Audio.sfx("click");
          } catch (_) {
          }
        });
        play.after(box);
      }
      const t = text(), current = mode();
      box.title = t.title;
      for (const button of box.querySelectorAll("button")) {
        button.textContent = t[button.dataset.mode];
        button.classList.toggle("on", button.dataset.mode === current);
        button.setAttribute("aria-pressed", String(button.dataset.mode === current));
      }
      const list = play.parentElement;
      if (list) list.classList.toggle("ps-mode-side", getComputedStyle(list).display === "grid");
      let sub = play.querySelector("small");
      if (sub) {
        sub.setAttribute("translate", "no");
        sub.textContent = t[current + "Sub"];
      }
    }
    render();
    addEventListener("resize", () => {
      if (document.getElementById("ps-run-mode")) render();
    });
    const menu = document.getElementById("scr-menu");
    if (menu) new MutationObserver(() => {
      if (!menu.classList.contains("hidden")) render();
    }).observe(menu, { attributes: true, attributeFilter: ["class"] });
  })();
  ;
  (() => {
    const LABEL = { zh: "\u7B5B\u9009", en: "Filter", es: "Filtros" };
    let open2 = false;
    function active() {
      const filters = [...document.querySelectorAll("#dex-filters .chip.on")].filter((c, i, all) => c !== document.querySelector("#dex-filters .chip"));
      const sortFirst = document.querySelector("#dex-sort .chip");
      const sortOn = document.querySelector("#dex-sort .chip.on");
      return filters.length + (sortOn && sortOn !== sortFirst ? 1 : 0);
    }
    function sync() {
      var _a;
      const tools = document.querySelector("#scr-dex .dex-tools");
      if (!tools) return;
      let button = document.getElementById("ps-dex-filter");
      if (!button) {
        button = document.createElement("button");
        button.id = "ps-dex-filter";
        button.type = "button";
        button.className = "btn small ghost";
        button.setAttribute("translate", "no");
        button.onclick = () => {
          open2 = !open2;
          sync();
        };
        const type = document.getElementById("dex-type");
        (type || tools.lastElementChild).after(button);
      }
      const n = active();
      const lang = String(((_a = G.I18n) == null ? void 0 : _a.lang) || ""), text = (/^zh/.test(lang) ? LABEL.zh : lang === "es" ? LABEL.es : LABEL.en) + (n ? " \xB7 " + n : "") + (open2 ? " \u25B4" : " \u25BE");
      if (button.textContent !== text) button.textContent = text;
      if (button.classList.contains("gold") !== n > 0) {
        button.classList.toggle("gold", n > 0);
        button.classList.toggle("ghost", !n);
      }
      const screen2 = document.getElementById("scr-dex");
      if (screen2.classList.contains("ps-dex-open") !== open2) screen2.classList.toggle("ps-dex-open", open2);
    }
    const screen = document.getElementById("scr-dex");
    if (!screen) return;
    new MutationObserver(sync).observe(screen, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    sync();
  })();
  ;
  (() => {
    const Player = G.Player, Touch = G.Touch, canvas = document.getElementById("game");
    if (!Player || !Touch || !canvas || typeof Player.prototype.update !== "function") return;
    const STICK_KEY = "ps.attackStick";
    const TEXT = {
      zh: { layTitle: "\u653B\u51FB\u952E", float: "\u6D6E\u52A8", fixed: "\u56FA\u5B9A", tag: "\u653B\u51FB\u952E" },
      en: { layTitle: "Attack", float: "Floating", fixed: "Fixed", tag: "Attack stick" },
      es: { layTitle: "Ataque", float: "Flotante", fixed: "Fijo", tag: "Stick de ataque" }
    };
    const text = () => {
      const l = String(G.I18n && G.I18n.lang || "");
      return /^zh/.test(l) ? TEXT.zh : l === "es" ? TEXT.es : TEXT.en;
    };
    const read = (key, fallback) => {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : v;
      } catch (_) {
        return fallback;
      }
    };
    const write = (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (_) {
      }
    };
    const DEF_POS = [0.84, 0.64];
    try {
      localStorage.removeItem("ps.attackMode");
    } catch (_) {
    }
    let stickCfg = (() => {
      try {
        const v = JSON.parse(read(STICK_KEY, "null"));
        if (v && (v.mode === "fixed" || v.mode === "float")) return { mode: v.mode, pos: Array.isArray(v.pos) ? v.pos : DEF_POS };
      } catch (_) {
      }
      return { mode: "float", pos: DEF_POS };
    })();
    const R = () => Touch.R ? Touch.R() : 56;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const W = () => canvas.clientWidth || innerWidth, H = () => canvas.clientHeight || innerHeight;
    function attackBase(pos = stickCfg.pos) {
      const r = R();
      return { x: clamp(pos[0] * W(), r + 4, W() - r - 4), y: clamp(pos[1] * H(), r + 4, H() - r - 4) };
    }
    const moveFixed = () => G.Settings.get("stickMode") === "fixed";
    let move = null, attack = null;
    const attacking = () => !!attack;
    let lastAim = null;
    function dragAngle() {
      if (!attack) return null;
      const dx = attack.x - attack.ox, dy = attack.y - attack.oy;
      if (Math.hypot(dx, dy) <= 10) return null;
      return lastAim = Math.atan2(dy, dx);
    }
    function aimAngle(player) {
      const drag = dragAngle();
      if (drag != null) return drag;
      if (attacking()) return lastAim != null ? lastAim : player && typeof player.aim === "number" ? player.aim : 0;
      return null;
    }
    function follow(s) {
      if (s.fixed) return;
      const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), r = R();
      if (d > r) {
        s.ox = s.x - dx / d * r;
        s.oy = s.y - dy / d * r;
      }
    }
    let buttons = [];
    const clearButtons = Touch.clearButtons, addButton = Touch.addButton;
    Touch.clearButtons = function() {
      buttons = [];
      return clearButtons.apply(this, arguments);
    };
    Touch.addButton = function(x, y, w, h, fn, pad = 6) {
      buttons.push({ x, y, w, h, pad });
      return addButton.apply(this, arguments);
    };
    const onButton = (x, y) => buttons.some((b) => x >= b.x - b.pad && x <= b.x + b.w + b.pad && y >= b.y - b.pad && y <= b.y + b.h + b.pad);
    addEventListener("pointerdown", (event) => {
      if (event.target !== canvas || event.pointerType === "mouse" || !G.Game || G.Game.state !== "playing") return;
      const x = event.clientX, y = event.clientY;
      if (onButton(x, y)) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      if (!document.body.classList.contains("touch")) document.body.classList.add("touch");
      const r = R(), id = event.pointerId;
      let role;
      if (stickCfg.mode === "fixed") {
        const b = attackBase();
        role = Math.hypot(x - b.x, y - b.y) <= 2.2 * r ? "attack" : "move";
      } else role = x >= W() / 2 ? "attack" : "move";
      if (role === "attack") {
        if (attack) return;
        const b = stickCfg.mode === "fixed" ? attackBase() : { x, y };
        attack = { id, ox: b.x, oy: b.y, x, y, fixed: stickCfg.mode === "fixed" };
      } else {
        if (move) return;
        if (moveFixed()) {
          const b = Touch.stickBase();
          if (Math.hypot(x - b.x, y - b.y) > 2.2 * r) return;
          move = { id, ox: b.x, oy: b.y, x, y, fixed: true };
        } else move = { id, ox: x, oy: y, x, y };
      }
      try {
        canvas.setPointerCapture(id);
      } catch (_) {
      }
    }, true);
    addEventListener("pointermove", (event) => {
      for (const s of [move, attack]) if (s && s.id === event.pointerId) {
        s.x = event.clientX;
        s.y = event.clientY;
        follow(s);
      }
    }, true);
    const end = (event) => {
      if (move && move.id === event.pointerId) move = null;
      if (attack && attack.id === event.pointerId) attack = null;
    };
    addEventListener("pointerup", end, true);
    addEventListener("pointercancel", end, true);
    const clearAll = () => {
      move = null;
      attack = null;
    };
    addEventListener("blur", clearAll);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearAll();
    });
    const vector = Touch.vector;
    Touch.vector = function() {
      if (!move) return vector.apply(this, arguments);
      const dx = move.x - move.ox, dy = move.y - move.oy, d = Math.hypot(dx, dy);
      if (d < 7) return [0, 0];
      const k = Math.min(1, (d - 7) / (0.5 * R() - 7));
      return [dx / d * k, dy / d * k];
    };
    function drawAttack(ctx, s, r, alpha) {
      const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), kx = s.ox + (d > r ? dx / d * r : dx), ky = s.oy + (d > r ? dy / d * r : dy);
      ctx.save();
      ctx.globalAlpha = 0.5 * alpha;
      ctx.fillStyle = "rgba(48,10,16,.55)";
      ctx.beginPath();
      ctx.arc(s.ox, s.oy, r, 0, 6.2832);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ff8a6b";
      ctx.stroke();
      ctx.globalAlpha = 0.85 * alpha;
      ctx.fillStyle = "#ff6b4a";
      ctx.beginPath();
      ctx.arc(kx, ky, 0.42 * r, 0, 6.2832);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#8a1f10";
      ctx.stroke();
      ctx.restore();
    }
    function drawButton(ctx, x, y, r) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "rgba(120,24,16,.55)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ff8a6b";
      ctx.stroke();
      ctx.fillStyle = "#ff6b4a";
      ctx.beginPath();
      ctx.arc(x, y, 0.62 * r, 0, 6.2832);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#8a1f10";
      ctx.stroke();
      ctx.strokeStyle = "#fff2e8";
      ctx.lineWidth = Math.max(2, 0.09 * r);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (const k of [-1, 0, 1]) {
        ctx.moveTo(x - 0.26 * r + k * 0.2 * r, y + 0.3 * r);
        ctx.lineTo(x + 0.18 * r + k * 0.2 * r, y - 0.3 * r);
      }
      ctx.stroke();
      ctx.restore();
    }
    const draw = Touch.draw;
    Touch.draw = function(ctx) {
      const touch = document.body.classList.contains("touch"), r = R();
      if (!move && (Touch.stick || !touch)) draw.apply(this, arguments);
      else if (move) Touch.drawStick(ctx, move, r, 1);
      else if (moveFixed()) {
        const b = Touch.stickBase();
        Touch.drawStick(ctx, { ox: b.x, oy: b.y, x: b.x, y: b.y }, r, 0.55);
      }
      if (attack) drawAttack(ctx, attack, r, 1);
      else if (touch && G.Game.state === "playing") {
        const b = attackBase();
        drawButton(ctx, b.x, b.y, 0.62 * r);
      }
    };
    const update = Player.prototype.update;
    Player.prototype.update = function(dt, ...rest) {
      const result = update.call(this, dt, ...rest);
      const local = this === G.Game.player && !this.remote;
      if (local && attacking() && !this.dead) {
        const a = typeof this.aim === "number" ? this.aim : 0, t = this.target;
        if (!t || t.dead || Math.hypot(t.x - this.x, t.y - this.y) > 320) this.target = { x: this.x + 150 * Math.cos(a), y: this.y + 150 * Math.sin(a), r: 0, hp: 1, dead: false, psVirtual: true };
      }
      return result;
    };
    const cast = Player.prototype.cast;
    Player.prototype.cast = function(m, ...rest) {
      const t = this.target;
      if (m && m.kind === "meteor" && t && t.psVirtual && G.EnemyMgr && typeof G.EnemyMgr.queryCircle === "function") {
        const query = G.EnemyMgr.queryCircle, n = Math.max(1, m.count | 0);
        G.EnemyMgr.queryCircle = function() {
          G.EnemyMgr.queryCircle = query;
          return Array.from({ length: n }, () => ({ x: t.x + (Math.random() - 0.5) * 60, y: t.y + (Math.random() - 0.5) * 50, dead: false }));
        };
        setTimeout(() => {
          if (G.EnemyMgr.queryCircle !== query) G.EnemyMgr.queryCircle = query;
        }, 0);
      }
      return cast.call(this, m, ...rest);
    };
    const handAim = Player.prototype.handAim;
    Player.prototype.handAim = function() {
      const a = this === G.Game.player && !this.remote ? aimAngle(this) : null;
      if (a != null) return a;
      return handAim ? handAim.apply(this, arguments) : null;
    };
    if (G.Combat && typeof G.Combat.tick === "function") {
      const tick = G.Combat.tick;
      G.Combat.tick = function(dt, player, ...rest) {
        const result = tick.call(this, dt, player, ...rest);
        const p = G.Game.player;
        if (p && p.manualAim && attack && !(G.Pad && G.Pad.aim && G.Pad.aim())) p.manualAim = false;
        return result;
      };
    }
    if (G.LayoutUI && typeof G.LayoutUI.open === "function") {
      const open2 = G.LayoutUI.open;
      let draft = null;
      G.LayoutUI.open = function() {
        const result = open2.apply(this, arguments);
        const modeRow = document.getElementById("lay-mode");
        const root = modeRow && modeRow.closest("section");
        if (!root) return result;
        draft = { mode: stickCfg.mode, pos: stickCfg.pos.slice() };
        const t = text();
        let row = document.getElementById("ps-lay-atk"), thing = root.querySelector(".ps-lay-atk");
        if (!row) {
          row = document.createElement("div");
          row.id = "ps-lay-atk";
          row.className = "chips set-chips";
          row.setAttribute("translate", "no");
          modeRow.after(row);
          row.addEventListener("click", (event) => {
            const b = event.target.closest("[data-m]");
            if (!b) return;
            draft.mode = b.dataset.m;
            sync();
          });
          thing = document.createElement("div");
          thing.className = "lay-thing lay-stick ps-lay-atk";
          thing.setAttribute("translate", "no");
          thing.innerHTML = '<div class="knob"></div><span class="lay-tag"></span>';
          root.appendChild(thing);
          let grab = null;
          thing.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            const b = attackBase(draft.pos);
            grab = [event.clientX - b.x, event.clientY - b.y];
            thing.classList.add("held");
            try {
              thing.setPointerCapture(event.pointerId);
            } catch (_) {
            }
          });
          thing.addEventListener("pointermove", (event) => {
            if (!grab) return;
            draft.pos = [(event.clientX - grab[0]) / W(), (event.clientY - grab[1]) / H()];
            const b = attackBase(draft.pos);
            draft.pos = [b.x / W(), b.y / H()];
            sync();
          });
          const drop = () => {
            grab = null;
            thing.classList.remove("held");
          };
          thing.addEventListener("pointerup", drop);
          thing.addEventListener("pointercancel", drop);
          root.addEventListener("click", (event) => {
            if (!draft) return;
            if (event.target.closest("#lay-save")) {
              stickCfg = { mode: draft.mode, pos: draft.pos.map((v) => +v.toFixed(4)) };
              write(STICK_KEY, JSON.stringify(stickCfg));
            } else if (event.target.closest("#lay-reset")) {
              draft = { mode: "float", pos: DEF_POS.slice() };
              setTimeout(sync);
            }
          }, true);
          addEventListener("resize", () => {
            if (draft && !root.classList.contains("hidden")) sync();
          });
        }
        row.innerHTML = `<b>${t.layTitle}</b><button class="chip" data-m="float">${t.float}</button><button class="chip" data-m="fixed">${t.fixed}</button>`;
        thing.querySelector(".lay-tag").textContent = t.tag;
        function sync() {
          row.querySelectorAll("[data-m]").forEach((b2) => b2.classList.toggle("on", b2.dataset.m === draft.mode));
          const r = R(), b = attackBase(draft.pos);
          Object.assign(thing.style, { left: b.x - r + "px", top: b.y - r + "px", width: 2 * r + "px", height: 2 * r + "px" });
          thing.classList.toggle("hidden", draft.mode !== "fixed");
        }
        sync();
        return result;
      };
    }
    G.AttackButton = { get attacking() {
      return attacking();
    }, get aim() {
      return aimAngle(G.Game.player);
    }, get sticks() {
      return { move, attack };
    }, get placement() {
      return stickCfg.mode;
    }, get buttons() {
      return buttons.slice();
    }, setPlacement(m, pos) {
      stickCfg = { mode: m === "fixed" ? "fixed" : "float", pos: pos || stickCfg.pos };
      write(STICK_KEY, JSON.stringify(stickCfg));
    } };
  })();
  ;
  (() => {
    const DB = G.DB;
    if (!DB || typeof DB.saveNow !== "function" || typeof DB.flush !== "function") return;
    const MIN_AWAY = 6e4, MIN_GAP = 18e4;
    let hiddenAt = 0, lastPull = 0, lastPush = 0;
    const online = () => {
      try {
        return !!DB.online;
      } catch (_) {
        return false;
      }
    };
    const run = (fn) => {
      try {
        Promise.resolve(fn()).catch(() => {
        });
      } catch (_) {
      }
    };
    function push() {
      if (!online() || !/^(pending|offline)$/.test(DB.syncState)) return;
      const now = Date.now();
      if (now - lastPush < 5e3) return;
      lastPush = now;
      run(() => DB.saveNow());
    }
    function leave() {
      if (!hiddenAt) hiddenAt = Date.now();
      push();
    }
    function back() {
      const away = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = 0;
      if (!online() || away < MIN_AWAY || Date.now() - lastPull < MIN_GAP) return;
      if (G.Game && G.Game.state && G.Game.state !== "ui") return;
      lastPull = Date.now();
      run(() => DB.flush());
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") leave();
      else back();
    });
    addEventListener("pagehide", leave);
    const audio = G.Audio, setActive = audio && audio.setAppActive;
    if (typeof setActive === "function") audio.setAppActive = function(active) {
      if (active === false) leave();
      else if (active === true) back();
      return setActive.apply(this, arguments);
    };
    G.CloudSync = { leave, back };
  })();
  ;
  (() => {
    var _a;
    if (location.protocol === "file:") document.documentElement.classList.add("ps-offline");
    const bar = document.getElementById("topbar");
    if (!bar) return;
    let frame = 0;
    function update() {
      frame = 0;
      const bottom = bar.classList.contains("hidden") ? 0 : Math.ceil(bar.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty("--ps-chrome-bottom", bottom + "px");
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    if (typeof ResizeObserver === "function") new ResizeObserver(schedule).observe(bar);
    new MutationObserver(schedule).observe(bar, { attributes: true, attributeFilter: ["class", "style"], subtree: true, childList: true, characterData: true });
    addEventListener("resize", schedule);
    (_a = window.visualViewport) == null ? void 0 : _a.addEventListener("resize", schedule);
    const detail = document.getElementById("dex-detail");
    function arrangeDetail() {
      if (!detail || detail.querySelector(":scope > .ps-dex-content") || !detail.firstChild) return;
      const content = document.createElement("div");
      content.className = "ps-dex-content";
      const action = document.createElement("div");
      action.className = "ps-dex-action";
      for (const node of [...detail.childNodes]) {
        if (node.nodeType === 1 && node.matches("button.btn")) action.appendChild(node);
        else content.appendChild(node);
      }
      detail.append(content, action);
    }
    if (detail) {
      new MutationObserver(arrangeDetail).observe(detail, { childList: true });
      arrangeDetail();
    }
    schedule();
  })();
  G.ExitApp = async function() {
    G.Audio.stopForExit();
    try {
      G.DB.commit(true);
    } catch (e) {
    }
    if (G.DB.online) {
      try {
        await Promise.race([G.DB.flush(), new Promise((resolve) => setTimeout(resolve, 6e3))]);
      } catch (e) {
      }
    }
    if (window.AndroidApp && window.AndroidApp.exit) {
      window.AndroidApp.exit();
      return;
    }
    try {
      window.close();
    } catch (e) {
    }
    G.UI.toast("Guardado. Ya puedes cerrar el juego.", 3e3);
  };
  G.I18n.add({ "Mapa": "Map", "Mapa \xB7 M": "Map \xB7 M", "Mapa de recursos": "Resource map", "Volver": "Back", "Alejar": "Zoom out", "Acercar": "Zoom in", "Centrar": "Recenter", "Recursos": "Resources", "Cofre peque\xF1o": "Small chest", "Cofre grande": "Large chest", "Altar": "Power altar", "Manantial": "Healing spring", "Trampa": "Trap", "\xC1rbol": "Tree", "Minimapa de combate": "Combat minimap", "Toca el minimapa o pulsa M para abrir el mapa.": "Tap the minimap or press M to open the map.", "Mostrar predicciones": "Show predictions", "Mostrar terreno": "Show terrain", "Contornos: recursos a\xFAn no cargados; pueden haber cambiado.": "Dashed rings mark predicted resources; their state may have changed.", "Suelo, paredes y agua.": "Show ground, walls and water.", "Los filtros y el zoom se guardan en este dispositivo.": "Filters and zoom are saved on this device.", "Marcadores s\xF3lidos: zona cargada. Contornos: predicci\xF3n. Los recursos lejanos pueden haber cambiado.": "Normal icons: confirmed resources. Dashed rings: predictions; actual state may differ.", "Arrastra para explorar \xB7 pellizca o usa +/\u2212 para ampliar \xB7 M / Esc para volver.": "Drag to explore \xB7 pinch or use +/\u2212 to zoom \xB7 M / Esc to return.", "Partida en pausa.": "Game paused.", "Selecciona un recurso para ver su distancia.": "Select a resource to see its distance.", "casillas": "tiles", "confirmados": "confirmed", "predichos": "predicted", "Predicci\xF3n": "Predicted", "Confirmado": "Confirmed", "Tu posici\xF3n": "You", "Aliado en el mapa": "Teammate", "Entrada de grieta": "Rift", "Recurso previsto": "Dashed ring = prediction", "Verde: suelo \xB7 gris: paredes \xB7 azul: agua": "Green: ground \xB7 gray: walls \xB7 blue: water", "Solicitando pausa al grupo\u2026": "Requesting a group pause\u2026" }, "en");
  if (/^zh/.test(G.I18n.lang)) G.I18n.add({ "Mapa": "\u5730\u56FE", "Mapa \xB7 M": "\u5730\u56FE \xB7 M", "Mapa de recursos": "\u8D44\u6E90\u5730\u56FE", "Volver": "\u8FD4\u56DE", "Alejar": "\u7F29\u5C0F", "Acercar": "\u653E\u5927", "Centrar": "\u56DE\u5230\u73A9\u5BB6", "Recursos": "\u8D44\u6E90\u7B5B\u9009", "Cofre peque\xF1o": "\u5C0F\u5B9D\u7BB1", "Cofre grande": "\u5927\u5B9D\u7BB1", "Altar": "\u589E\u76CA\u796D\u575B", "Manantial": "\u6CBB\u7597\u6CC9\u6C34", "Trampa": "\u9677\u9631", "\xC1rbol": "\u6811\u6728", "Minimapa de combate": "\u6218\u6597\u5C0F\u5730\u56FE", "Toca el minimapa o pulsa M para abrir el mapa.": "\u70B9\u51FB\u5C0F\u5730\u56FE\u6216\u6309 M \u6253\u5F00\u5E7F\u57DF\u5730\u56FE\u3002", "Mostrar predicciones": "\u663E\u793A\u9884\u6D4B\u8D44\u6E90", "Mostrar terreno": "\u663E\u793A\u5730\u5F62", "Contornos: recursos a\xFAn no cargados; pueden haber cambiado.": "\u5E26\u865A\u7EBF\u5708\u7684\u56FE\u6807\u8868\u793A\u9884\u6D4B\u8D44\u6E90\uFF0C\u5B9E\u9645\u72B6\u6001\u53EF\u80FD\u5DF2\u6539\u53D8\u3002", "Suelo, paredes y agua.": "\u663E\u793A\u5730\u9762\u3001\u5CA9\u58C1\u548C\u6C34\u57DF\u3002", "Los filtros y el zoom se guardan en este dispositivo.": "\u7B5B\u9009\u548C\u7F29\u653E\u4F1A\u4FDD\u5B58\u5728\u6B64\u8BBE\u5907\u4E0A\u3002", "Marcadores s\xF3lidos: zona cargada. Contornos: predicci\xF3n. Los recursos lejanos pueden haber cambiado.": "\u666E\u901A\u56FE\u6807\uFF1A\u5DF2\u786E\u8BA4\u8D44\u6E90\u3002\u5E26\u865A\u7EBF\u5708\uFF1A\u9884\u6D4B\u8D44\u6E90\uFF0C\u5B9E\u9645\u72B6\u6001\u53EF\u80FD\u5DF2\u6539\u53D8\u3002", "Arrastra para explorar \xB7 pellizca o usa +/\u2212 para ampliar \xB7 M / Esc para volver.": "\u62D6\u52A8\u6D4F\u89C8 \xB7 \u53CC\u6307\u6216 +/\u2212 \u7F29\u653E \xB7 M / Esc \u8FD4\u56DE", "Partida en pausa.": "\u6E38\u620F\u5DF2\u6682\u505C\u3002", "Selecciona un recurso para ver su distancia.": "\u70B9\u51FB\u8D44\u6E90\u6807\u8BB0\u67E5\u770B\u5750\u6807\u548C\u8DDD\u79BB\u3002", "casillas": "\u683C", "confirmados": "\u5DF2\u786E\u8BA4", "predichos": "\u9884\u6D4B", "Predicci\xF3n": "\u9884\u6D4B\u8D44\u6E90", "Confirmado": "\u5DF2\u786E\u8BA4", "Tu posici\xF3n": "\u4F60\u7684\u4F4D\u7F6E", "Aliado en el mapa": "\u961F\u53CB", "Entrada de grieta": "\u88C2\u9699\u5165\u53E3", "Recurso previsto": "\u865A\u7EBF\u5708\uFF1D\u9884\u6D4B", "Verde: suelo \xB7 gris: paredes \xB7 azul: agua": "\u7EFF\u8272\uFF1A\u5730\u9762 \xB7 \u7070\u8272\uFF1A\u5CA9\u58C1 \xB7 \u84DD\u8272\uFF1A\u6C34\u57DF", "Solicitando pausa al grupo\u2026": "\u6B63\u5728\u8BF7\u6C42\u5168\u961F\u6682\u505C\u2026" }, G.I18n.lang);
  G.Flow = officialFlow;
  const officialBoot = officialFlow.boot;
  let booted = false;
  officialFlow.boot = function(...args) {
    if (booted) return;
    booted = true;
    try {
      G.MapUI.init();
      return officialBoot.apply(this, args);
    } catch (error) {
      recover(error);
    }
  };
  const open = G.LoginUI.open;
  G.LoginUI.open = function() {
    var _a;
    open.call(this);
    document.getElementById("btn-google").classList.add("hidden");
    document.getElementById("btn-google").parentElement.classList.add("hidden");
    if (((_a = window.AndroidApp) == null ? void 0 : _a.openOffline) && !document.getElementById("login-local-offline")) {
      const button = document.createElement("button");
      button.id = "login-local-offline";
      button.className = "btn small ghost";
      button.textContent = "\u672C\u5730\u79BB\u7EBF\u5B58\u6863";
      button.onclick = () => window.AndroidApp.openOffline();
      document.getElementById("btn-guest").parentElement.appendChild(button);
    }
  };
  const openSettings = G.SettingsUI.open;
  G.SettingsUI.open = function(tab) {
    if (tab === "map") {
      openSettings.call(this);
      renderMapSettings();
    } else openSettings.call(this, tab);
    addOfflineEntry();
  };
  function renderMapSettings() {
    document.querySelectorAll("#set-tabs .gen-tab").forEach((b) => b.classList.toggle("on", b.dataset.t === "map"));
    const box = document.getElementById("set-body");
    box.scrollTop = 0;
    box.innerHTML = G.MapUI.settingsHTML();
    box.querySelectorAll(".switch[data-k]").forEach((b) => {
      b.onclick = () => {
        G.Settings.set(b.dataset.k, !G.Settings.get(b.dataset.k));
        renderMapSettings();
      };
    });
  }
  document.getElementById("set-tabs").addEventListener("click", (event) => {
    if (!event.target.closest('[data-t="map"]')) return;
    event.stopPropagation();
    renderMapSettings();
  }, true);
  function addOfflineEntry() {
    var _a;
    const box = document.getElementById("set-body");
    if (((_a = document.querySelector("#set-tabs .gen-tab.on")) == null ? void 0 : _a.dataset.t) !== "acc") return;
    if (!box || document.getElementById("online-offline-mode")) return;
    if (location.protocol === "file:") {
      box.innerHTML = '<h3 class="set-h">\u8D26\u53F7</h3>';
      const note = document.createElement("p");
      note.className = "sub";
      note.textContent = "\u5F53\u524D\u4E3A\u672C\u5730\u79BB\u7EBF\u7248\uFF0C\u8FDB\u5EA6\u53EA\u4FDD\u5B58\u5728\u6B64\u8BBE\u5907\uFF1B\u5B98\u7F51\u8D26\u53F7\u8BF7\u8FD4\u56DE\u5728\u7EBF\u7248\u767B\u5F55\u3002\u4E24\u4E2A\u6A21\u5F0F\u7684\u5B58\u6863\u5206\u522B\u4FDD\u5B58\u3002";
      box.appendChild(note);
    }
    const button = document.createElement("button");
    button.id = "online-offline-mode";
    button.className = "btn small";
    if (location.protocol === "file:") {
      button.className = "btn gold";
      button.textContent = "\u8FD4\u56DE\u5B98\u7F51\u5728\u7EBF\u7248";
      button.onclick = () => {
        try {
          G.DB.commit(true);
        } catch (_) {
        }
        if (window.AndroidApp && AndroidApp.openOnline) AndroidApp.openOnline();
        else location.href = "https://pokesurvivor.com/";
      };
      box.appendChild(button);
      return;
    }
    button.textContent = "\u6253\u5F00\u672C\u5730\u79BB\u7EBF\u5B58\u6863";
    button.onclick = async () => {
      var _a2;
      G.DB.commit(true);
      try {
        if (G.DB.online) await Promise.race([G.DB.flush(), new Promise((r) => setTimeout(r, 6e3))]);
      } catch (_) {
      }
      if ((_a2 = window.AndroidApp) == null ? void 0 : _a2.openOffline) window.AndroidApp.openOffline();
      else G.UI.toast("\u8BF7\u5728 APK \u5185\u6253\u5F00\u79BB\u7EBF\u5B58\u6863\u3002");
    };
    box.appendChild(button);
  }
  if (location.protocol === "file:") {
    const chrome = +((navigator.userAgent.match(/Chrome[/](\d+)/) || [])[1] || 0);
    if (chrome && chrome < 80) setTimeout(() => {
      try {
        G.UI.toast("\u7CFB\u7EDF WebView \u7248\u672C\u8F83\u65E7\uFF08Chrome " + chrome + "\uFF09\uFF0C\u5B98\u7F51\u5728\u7EBF\u7248\u9700\u8981 Chrome 80 \u4EE5\u4E0A\uFF0C\u5DF2\u8FDB\u5165\u79BB\u7EBF\u7248\u3002\u5728\u5E94\u7528\u5546\u5E97\u66F4\u65B0\u201CAndroid System WebView\u201D\u540E\u5373\u53EF\u4F7F\u7528\u5728\u7EBF\u7248\u548C\u8D26\u53F7\u3002", 1e4);
      } catch (_) {
      }
    }, 3e3);
  }
  if (location.protocol === "file:" && window.AndroidApp && AndroidApp.openOnline && !document.getElementById("ps-go-online")) {
    const bar = document.getElementById("topbar");
    if (bar) {
      const b = document.createElement("button");
      b.id = "ps-go-online";
      b.className = "btn small gold";
      b.setAttribute("translate", "no");
      b.textContent = "\u8FD4\u56DE\u5728\u7EBF\u7248";
      b.onclick = () => {
        try {
          G.DB.commit(true);
        } catch (_) {
        }
        AndroidApp.openOnline();
      };
      bar.prepend(b);
    }
  }
  const observer = new MutationObserver(() => {
    if (document.querySelector("#scr-settings:not(.hidden)")) {
      addOfflineEntry();
    }
  });
  observer.observe(document.getElementById("set-body"), { childList: true });
  window.__PSOnlineInstalled = { version: "1.4.6", origin: location.origin, officialDBUnchanged: G.DB === officialDB, officialConfigUnchanged: G.FIREBASE_CONFIG === officialConfig, officialFlowUnchanged: G.Flow === officialFlow, officialGameUnchanged: G.Game === officialGame && G.Game.startRun === officialStart, judgment: !!G.Judgment };
});
var prior=Object.getOwnPropertyDescriptor(Object.prototype,'Game');
var captured=false;
var setter=function(value){
  Object.defineProperty(this,'Game',{value,writable:true,enumerable:true,configurable:true});
  if(this.World&&this.DB&&this.Touch&&value&&typeof value.startRun==='function'){
    captured=true;
    if(prior)Object.defineProperty(Object.prototype,'Game',prior);else delete Object.prototype.Game;
    var root=this;
    Promise.resolve().then(function(){try{install(root,recover);}catch(error){recover(error);}});
  }
};
if(!prior)Object.defineProperty(Object.prototype,'Game',{configurable:true,set:setter});
setTimeout(function(){var d=Object.getOwnPropertyDescriptor(Object.prototype,'Game');if(d&&d.set===setter)delete Object.prototype.Game;if(!captured&&!window.__PSOnlineInstalled)recover('Official game object was not captured');},20000);
})();
