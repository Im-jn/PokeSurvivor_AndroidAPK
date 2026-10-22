// Local translation engine from ChineseWideMap; UI uses the native language setting.
G.ZhTranslate = (() => {
  const data = G.ZhData;
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exact = new Map(), terms = new Map(), patternMap = new Map(), cache = new Map();
  let patterns = [], termPattern = null;
  function add(dict,rawSlots={}) {
  for (const [source, target] of Object.entries(dict)) {
    if(typeof target!=='string'||!target)continue;
    const key = normalize(source);
    if (key.includes('{x}')) {
      patternMap.set(key.toLowerCase(),{
        re: new RegExp('^' + key.split('{x}').map(escape).join('(.+?)') + '$', 'iu'),
        target, raw: rawSlots[source] || patternMap.get(key.toLowerCase())?.raw || data.rawSlots[source] || [], weight: key.replaceAll('{x}', '').length,
      });
    } else {
      exact.set(key.toLowerCase(), target);
      // Short words are safe as whole phrases, but ambiguous in longer text.
      if (Object.hasOwn(data.names, source) || key.length >= 4 || key === 'HP' || key === 'ATK' || key === 'DEF' || key === 'SPD') terms.set(key.toLowerCase(), target);
    }
  }
  patterns=[...patternMap.values()].sort((a, b) => b.weight - a.weight);
  termPattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + [...terms.keys()].sort((a,b) => b.length-a.length).map(escape).join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
  cache.clear();
  }
  add({...data.names,...data.phrases},data.rawSlots);
  function translate(source, depth = 0) {
    if (typeof source !== 'string' || !source || !/[a-zÀ-ž]/i.test(source)) return source;
    if (!depth && cache.has(source)) return cache.get(source);
    const core = normalize(source);
    let result = exact.get(core.toLowerCase());
    if (result === undefined && depth < 5) {
      for (const pattern of patterns) {
        const match = pattern.re.exec(core);
        if (!match) continue;
        let i = 0;
        result = pattern.target.replace(/\{x\}/g, () => {
          const index = i++, value = match[index + 1];
          return pattern.raw.includes(index) ? value : translate(value, depth + 1);
        });
        break;
      }
    }
    if (result === undefined) result = core.replace(termPattern, word => terms.get(word.toLowerCase()));
    result=result.replace(/\b(\d+)\s*h\b/gi,'$1 小时').replace(/\b(\d+)\s*min\b/gi,'$1 分钟');
    // Preserve original spacing if no translation is available.
    if (result === core) result = source;
    else result = (source.match(/^\s*/)?.[0] || '') + result + (source.match(/\s*$/)?.[0] || '');
    if (!depth) {
      if (cache.size >= 4000) cache.clear();
      cache.set(source, result);
    }
    return result;
  }

  translate.add=add;
  return translate;
})();
