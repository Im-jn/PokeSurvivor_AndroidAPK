// One-time migration from the user's browser extension into the bundled game.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), source = path.join(root, 'source');
const extension = path.resolve(root, '../PokeSurvivor_ChineseWideMap');
const read = p => fs.readFileSync(path.join(source, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(source, p), s);
function edit(p, from, to) {
  const s = read(p); if (!s.includes(from)) throw Error(`Missing anchor in ${p}: ${from}`);
  write(p, s.replace(from, to));
}
write('js/data/zh-dictionary.js', fs.readFileSync(path.join(extension, 'zh-dictionary.js'), 'utf8').replace('window.__PS_ZH_DATA__', 'G.ZhData'));
let translator = fs.readFileSync(path.join(extension, 'zh-translate.js'), 'utf8');
translator = translator.slice(translator.indexOf('  const normalize'), translator.indexOf('  let enabled = false;'));
write('js/core/zh-translate.js', '// Local translation engine from ChineseWideMap; UI uses the native language setting.\nG.ZhTranslate = (() => {\n  const data = G.ZhData;\n' + translator + '\n  return translate;\n})();\n');
edit('js/core/i18n.js', "    const c = cache.get(s);", "    if (lang === 'zh') return G.ZhTranslate(s);\n    const c = cache.get(s);");
edit('js/core/i18n.js', "const skipEl = el => !!(el && el.closest && el.closest('[translate=\"no\"], script, style, code'));", "const skipEl = el => !!(el && el.closest && el.closest('[translate=\"no\"], script, style, code, pre, textarea, input, [contenteditable=\"true\"]'));" );
edit('js/core/input.js', '    axis() {', "    reset() { down.clear(); pressed.clear(); mdown = false; },\n    axis() {");
edit('js/core/settings.js', 'stick: 1 };', "stick: 1, minimap: true, mapPredict: true, mapTerrain: true, mapRange: 96, mapFilters: ['chest', 'bigchest', 'altar', 'spring'] };");
edit('js/ui/ui.js', "'scr-nick', 'scr-friends'", "'scr-map', 'scr-nick', 'scr-friends'");
edit('js/game.js', '    G.Touch.draw(ctx);', '    G.MapUI.drawHUD(ctx, w, h, pl);\n    G.Touch.draw(ctx);');
edit('js/game.js', 'G.SettingsUI.init(); G.SupportUI.init();', 'G.SettingsUI.init(); G.MapUI.init(); G.SupportUI.init();');
edit('js/game.js', "G.UI.isOpen('scr-pause') || G.UI.isOpen('scr-item')", "G.UI.isOpen('scr-pause') || G.UI.isOpen('scr-map') || G.UI.isOpen('scr-item')");
edit('js/game.js', '  function togglePause() {', '  function togglePause() {\n    if (G.MapUI && G.MapUI.isOpen) { G.MapUI.close(); return; }');
edit('dev.html', '<link rel="stylesheet" href="css/style.css">', '<link rel="stylesheet" href="css/style.css">\n<link rel="stylesheet" href="css/map.css">');
edit('dev.html', '<script defer src="js/core/i18n.js"></script>', '<script defer src="js/data/zh-dictionary.js"></script>\n<script defer src="js/core/zh-translate.js"></script>\n<script defer src="js/core/i18n.js"></script>');
edit('dev.html', '<script defer src="js/ui/settings-ui.js"></script>', '<script defer src="js/ui/settings-ui.js"></script>\n<script defer src="js/ui/map-ui.js"></script>');
edit('dev.html', '<button class="gen-tab" data-t="ctl">', '<button class="gen-tab" data-t="map">Mapa</button>\n      <button class="gen-tab" data-t="ctl">');
edit('dev.html', '<button id="btn-pause-settings"', '<button id="btn-pause-map" class="btn">Mapa · M</button>\n      <button id="btn-pause-settings"');
edit('dev.html', '<!-- scripts:begin -->', `<section id="scr-map" class="scr dim hidden" role="dialog" aria-modal="true" aria-labelledby="map-title">
  <div class="box map-box">
    <div class="row between map-heading"><div><h2 id="map-title">Mapa de recursos</h2><p class="sub" id="map-status"></p></div><button id="map-close" class="btn small">Volver</button></div>
    <div class="map-layout"><div class="map-view"><canvas id="resource-map" width="480" height="480" tabindex="0" aria-label="Mapa de recursos"></canvas><p id="map-selection" class="note" aria-live="polite"></p></div>
    <div class="map-tools"><div class="row"><button class="btn small" id="map-out" aria-label="Alejar">−</button><button class="btn small" id="map-in" aria-label="Acercar">+</button><button class="btn small" id="map-center">Centrar</button></div>
    <h3>Recursos</h3><div id="map-filters" class="chips"></div><div id="map-options"></div>
    <p class="note">Marcadores sólidos: zona cargada. Contornos: predicción. Los recursos lejanos pueden haber cambiado.</p>
    <p class="note">Arrastra para explorar · pellizca o usa +/− para ampliar · M / Esc para volver.</p>
    <p class="note" id="map-session"></p></div></div>
  </div>
</section>
<!-- scripts:begin -->`);
edit('js/ui/settings-ui.js', "    } else if (tab === 'gfx') {", "    } else if (tab === 'map') {\n      box.innerHTML = G.MapUI.settingsHTML();\n    } else if (tab === 'gfx') {");
// Reuse one deterministic prop classifier for game generation and map previews.
let world = read('js/world/world.js');
const start = world.indexOf('  function placeProps(c) {'), end = world.indexOf('  const PROP =', start);
const old = world.slice(start, end);
let classify = old.slice(old.indexOf('      // Necesita'), old.indexOf('      const p = makeProp(type, tx, ty, kind);'));
classify = classify.replace('if (!arena || ad >= arena.r - 1.2 || arenaSafe(tx, ty)) continue;', 'if (!arena || ad >= arena.r - 1.2 || arenaSafe(tx, ty)) return null;')
  .replace("        if (at) { const p = makeProp(at, tx, ty); c.props.push(p); if (p.solid) c.propAt.set(tx + ',' + ty, p); }\n        continue;", '        return at ? { type: at, kind: 0 } : null;')
  .replace('if (!type) continue;', 'if (!type) return null;');
world = world.slice(0, start) + `  function propSpec(tx, ty) {
    if (terrainRaw(tx, ty) !== FLOOR || Math.hypot(tx, ty) < 7 || broken.has(tx + ',' + ty)) return null;
${classify}
    return { type, kind };
  }
  function placeProps(c) {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const tx = c.cx * N + i, ty = c.cy * N + j;
      const spec = propSpec(tx, ty);
      if (!spec) continue;
      const p = makeProp(spec.type, tx, ty, spec.kind);
      c.props.push(p);
      if (p.solid) c.propAt.set(tx + ',' + ty, p);
    }
  }

  // Read-only map data. Never calls chunkData/makeProp or consumes random state.
  const mapCache = new Map();
  function mapSample(tx0, ty0, cols, rows, predict = true) {
    cols = Math.max(1, Math.min(160, cols | 0)); rows = Math.max(1, Math.min(160, rows | 0));
    const terrain = new Uint8Array(cols * rows).fill(3), props = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const tx = tx0 + x, ty = ty0 + y, key = tx + ',' + ty;
      const cx = Math.floor(tx / N), cy = Math.floor(ty / N), c = data.get(cx + ',' + cy);
      if (c) terrain[y * cols + x] = c.terr[(ty - cy * N) * N + tx - cx * N];
      else if (predict) {
        let v = mapCache.get(key);
        if (!v) {
          v = { terrain: terrainRaw(tx, ty), spec: propSpec(tx, ty) };
          if (mapCache.size > 100000) mapCache.clear();
          mapCache.set(key, v);
        }
        terrain[y * cols + x] = v.terrain;
        if (v.spec && v.spec.type !== 'grass' && !broken.has(key)) props.push({ ...v.spec, tx, ty, predicted: true });
      }
    }
    for (const c of data.values()) for (const p of c.props) {
      if (p.hp <= 0 || p.used || p.type === 'grass') continue;
      if (p.tx >= tx0 && p.ty >= ty0 && p.tx < tx0 + cols && p.ty < ty0 + rows)
        props.push({type:p.type, tx:p.tx, ty:p.ty, x:p.x, y:p.y, charge:p.charge, predicted:false});
    }
    return { terrain, props, cols, rows, tx0, ty0, loadedChunks:data.size, seed };
  }

` + world.slice(end);
world = world.replace('    seed = (s | 0) || 1;', '    mapCache.clear();\n    seed = (s | 0) || 1;');
world = world.replace('      arena = a;', '      mapCache.clear();\n      arena = a;');
world = world.replace('    TS, CW, reset,', '    mapSample,\n    TS, CW, reset,');
write('js/world/world.js', world);
// Provenance is included in the APK with the translation data.
write('TRANSLATION-CHINESE.md', fs.readFileSync(path.join(extension, 'TRANSLATION.md'), 'utf8') + '\n\nAPK integration: dictionary and pure translator integrated with G.I18n; extension UI and capture hooks are not loaded.\n');
console.log('Source integration complete.');
