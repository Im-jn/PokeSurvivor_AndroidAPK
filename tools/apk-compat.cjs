// Check Android's mmap requirements, independently of signature/zipalign checks.
const fs = require('node:fs'), assert = require('node:assert/strict');
function entries(file) {
  const b = fs.readFileSync(file);
  let end = b.length - 22;
  const limit = Math.max(0, b.length - 65557);
  while (end >= limit && (b.readUInt32LE(end) !== 0x06054b50 || end + 22 + b.readUInt16LE(end + 20) !== b.length)) end--;
  assert(end >= limit, 'Missing ZIP end record');
  let offset = b.readUInt32LE(end + 16);
  const result = new Map();
  for (let i = 0; i < b.readUInt16LE(end + 10); i++) {
    assert.equal(b.readUInt32LE(offset), 0x02014b50, 'Invalid central directory');
    const n = b.readUInt16LE(offset + 28), extra = b.readUInt16LE(offset + 30), comment = b.readUInt16LE(offset + 32);
    const name = b.toString('utf8', offset + 46, offset + 46 + n);
    const local = b.readUInt32LE(offset + 42);
    assert.equal(b.readUInt32LE(local), 0x04034b50, 'Invalid local header');
    const method = b.readUInt16LE(offset + 10);
    assert.equal(b.readUInt16LE(local + 8), method, 'Compression method mismatch: ' + name);
    assert(!result.has(name), 'Duplicate ZIP entry: ' + name);
    result.set(name, {name, method, size:b.readUInt32LE(offset + 24), compressedSize:b.readUInt32LE(offset + 20), crc:b.readUInt32LE(offset + 16), time:b.readUInt16LE(offset + 12), date:b.readUInt16LE(offset + 14), dataOffset:local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28)});
    offset += 46 + n + extra + comment;
  }
  return result;
}
function check(file, original) {
  const files = entries(file), resource = files.get('resources.arsc');
  assert(resource, 'Missing resources.arsc');
  assert.equal(resource.method, 0, 'INSTALL -124: resources.arsc must be STORED, not compressed');
  assert.equal(resource.dataOffset % 4, 0, 'INSTALL -124: resources.arsc must be 4-byte aligned');
  if (original) for (const [name,entry] of entries(original)) {
    if (entry.method !== 0 || name.startsWith('META-INF/') || name.endsWith('/')) continue;
    assert(files.has(name), 'Missing original file: ' + name);
    assert.equal(files.get(name).method, 0, 'Originally uncompressed entry was compressed: ' + name);
  }
  console.log(`PASS Android packaging: resources.arsc STORED, offset ${resource.dataOffset}, divisible by 4; ${files.size} entries checked`);
}
module.exports = {entries, check};
if (require.main === module) {
  const [mode,file,out] = process.argv.slice(2);
  if (mode === '--stored-list') {
    const names = [...entries(file).values()].filter(e => e.method === 0).map(e => e.name);
    fs.writeFileSync(out, JSON.stringify(names));console.log(`Original APK: ${names.length} STORED entries`);
  } else check(mode,file);
}
