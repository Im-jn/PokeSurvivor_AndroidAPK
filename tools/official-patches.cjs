// Memory patches for the official client (late runs used to keep every sprite
// sheet decoded, plus a full-size white copy of each one for the hit flash).
// Each patch looks for a small, specific piece of the obfuscated code; when an
// official update changes it, that patch is skipped and the build says so.
const patches=[
  {
    // Sprite sheet cache: when a new sheet loads and 200 are held, drop those
    // unused for 20 s down to 150. A late run preloads 7 sheets per species
    // (50-70 species), so ~350 sheets / ~230 MB stayed decoded. Now 120 -> 80.
    name:'sprite-cache',
    re:/(\['size'\]>=)0xc8(&&function\(_0x\w+\)\{const (?:_0x\w+=a0_0x\w+,)?_0x\w+=\[\.\.\._0x\w+\]\['filter'\]\(\(\[,_0x\w+\]\)=>_0x\w+-_0x\w+\['at'\]>0x4e20\)\['sort'\][^;]{0,160}?Math\['floor'\]\()0x96\)/,
    to:'$10x78$20x50)',
  },
  {
    // ...and that only happens when a sheet loads, so after the burst of
    // preloads nothing was ever freed. Hand the cache to window.__psSheetCache
    // (enhancement prefix), which also evicts the same way while nothing loads.
    name:'sprite-sweep',
    re:/(\['Sprites'\]=\(\(\(\)=>\{const (?:_0x\w+=_0x\w+,)?_0x\w+=)new Map\(\)(;function _0x\w+\(_0x\w+\)\{return _0x\w+\[(?:'SPRITE_META'|_0x\w+\(0x\w+\))\])/,
    to:'$1(window.__psSheetCache?window.__psSheetCache():new Map())$2',
  },
  {
    // The spawner preloads all 7 animations of every species due in the next
    // minute, every 10 s, which keeps them all "in use". Only ~40% of them are
    // ever drawn. For such lists (more than 4 species) preload Idle and Walk;
    // other animations load when first played (meanwhile the client draws the
    // Idle frame). Single species (player, co-op partner, thief) keep all 7.
    name:'preload-anims',
    re:/('preload':function\((_0x\w+),_0x\w+=0x1f40,_0x\w+=!0x1\)\{const _0x\w+=\[\];for\(const _0x\w+ of \2\)for\(const _0x\w+ of )(_0x\w+)\)/,
    to:"$1($2['length']>0x4?['Idle','Walk']:$3))",
  },
  {
    // Hit-flash silhouettes: one canvas as big as the whole sheet per sheet,
    // kept as long as the sheet lives. Keep only the ones used in the last
    // seconds (window.__psWhiteCache, defined by the enhancement prefix).
    name:'white-cache',
    re:/(const _0x\w+=)new WeakMap\(\)(;function _0x\w+\(_0x\w+\)\{(?:const _0x\w+=a0_0x\w+;)?let _0x\w+=_0x\w+\['get'\]\(_0x\w+\);if\(_0x\w+\)return _0x\w+;_0x\w+=document\['createElement'\]\('canvas'\)[^}]{0,400}?'source-in')/,
    to:'$1(window.__psWhiteCache?window.__psWhiteCache():new WeakMap())$2',
  },
];
function patchOfficial(code){
  const applied=[],skipped=[];
  for(const p of patches){
    const matches=code.match(new RegExp(p.re.source,'g'));
    if(!matches||matches.length!==1){skipped.push(p.name);continue;}
    code=code.replace(p.re,p.to);applied.push(p.name);
  }
  return {code,applied,skipped};
}
module.exports={patchOfficial,patches};
