const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {entries,check}=require('../tools/apk-compat.cjs');
const root=path.resolve(__dirname,'..');
test('detect the -124 packaging failure in the original mod release',()=>{
  const broken=path.join(root,'verification/PokeSurvivor-ChineseMap-1.0-broken.apk');
  assert.throws(()=>check(broken),/must be STORED/);
});
test('source APK preserves the Android resource table mmap layout',()=>{
  const original=path.join(root,'apk',fs.readdirSync(path.join(root,'apk'))[0]);
  check(original);
});
test('current release retains originally STORED entries and Android-compatible alignment',()=>{
 const original=path.join(root,'apk',fs.readdirSync(path.join(root,'apk'))[0]);
 check(path.join(root,'dist/PokeSurvivor-1.5.5.apk'),original);
});
