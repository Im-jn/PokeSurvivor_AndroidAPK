// Write ZIP method 0 explicitly: Windows .NET Framework's NoCompression still
// emits DEFLATE (method 8), which Android rejects for resources.arsc.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {entries}=require('./apk-compat.cjs');
const root=path.resolve(__dirname,'..');
const original=path.join(root,'apk',fs.readdirSync(path.join(root,'apk'))[0]);
const archive=fs.readFileSync(original),old=entries(original);
const table=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(b){let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const out=path.join(root,'verification/PokeSurvivor-ChineseMap-fixed-unsigned.apk');
const fd=fs.openSync(out,'w'),central=[];let position=0,count=0;
const known=new Set();
function write(b){fs.writeSync(fd,b);position+=b.length;}
function add(name,content,method,meta={}){
  if(method!==0&&method!==8)throw Error('Unsupported original compression method '+method);
  const encoded=Buffer.from(name),data=method===0?content:zlib.deflateRawSync(content);
  const local=Buffer.alloc(30),offset=position,crc=crc32(content);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);
  local.writeUInt16LE(method,8);local.writeUInt16LE(meta.time||0,10);local.writeUInt16LE(meta.date||0x5821,12);
  local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(content.length,22);local.writeUInt16LE(encoded.length,26);
  write(local);write(encoded);write(data);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);
  c.writeUInt16LE(method,10);c.writeUInt16LE(meta.time||0,12);c.writeUInt16LE(meta.date||0x5821,14);
  c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(content.length,24);c.writeUInt16LE(encoded.length,28);c.writeUInt32LE(offset,42);
  central.push(c,encoded);known.add(name);count++;
}
try{
  for(const [name,entry]of old){
    if(name.startsWith('META-INF/')||name.endsWith('/'))continue;
    let content;
    if(name.startsWith('res/')&&fs.existsSync(path.join(root,'android/icon-res',name)))content=fs.readFileSync(path.join(root,'android/icon-res',name));
    else if(name==='classes.dex')content=fs.readFileSync(path.join(root,'android/build/apk/classes.dex'));
    else if(name==='AndroidManifest.xml')content=fs.readFileSync(path.join(root,'verification/AndroidManifest-widemap.xml'));
    else if(name.startsWith('assets/www/')&&fs.existsSync(path.join(root,'source',name.slice(11))))content=fs.readFileSync(path.join(root,'source',name.slice(11)));
    else{const raw=archive.subarray(entry.dataOffset,entry.dataOffset+entry.compressedSize);content=entry.method===0?raw:zlib.inflateRawSync(raw);}
    add(name,content,entry.method,entry);
  }
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else{const name='assets/www/'+path.relative(path.join(root,'source'),full).replaceAll('\\','/');if(!known.has(name))add(name,fs.readFileSync(full),8);}}}
  walk(path.join(root,'source'));
  const centralOffset=position;for(const c of central)write(c);
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(count,8);end.writeUInt16LE(count,10);end.writeUInt32LE(position-centralOffset,12);end.writeUInt32LE(centralOffset,16);write(end);
}finally{fs.closeSync(fd);}
if(entries(out).get('resources.arsc').method!==0)throw Error('Resource compression regression');
console.log(`Repacked ${count} entries preserving original compression methods: ${position} bytes`);
