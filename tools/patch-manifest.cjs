// Rebuild only the Android binary XML string pool. Attribute indices stay intact.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const b=fs.readFileSync(path.join(root,'verification/AndroidManifest.xml'));
const replacements={'.MainActivity':'com.john.pokesurvivor.MainActivity','com.john.pokesurvivor':'com.john.pokesurvivor.widemap','PokéSurvivor':'PokéSurvivor','2.0':'2.5.5'};
let chunks=[],seen=[],poolNames=[],versionCodes=0;
const pad=b=>Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);
const len8=n=>n>127?Buffer.from([0x80|(n>>8),n&255]):Buffer.from([n]);
for(let offset=8;offset<b.length;){
  const type=b.readUInt16LE(offset),headerSize=b.readUInt16LE(offset+2),size=b.readUInt32LE(offset+4);
  if(size<8||offset+size>b.length)throw Error('Invalid binary XML chunk');
  let chunk=b.subarray(offset,offset+size);
  if(type===1){
    const count=b.readUInt32LE(offset+8),styles=b.readUInt32LE(offset+12),flags=b.readUInt32LE(offset+16),start=offset+b.readUInt32LE(offset+20);
    if(styles)throw Error('Styled manifest string pools are not supported');
    const utf8=!!(flags&256),strings=[];
    for(let i=0;i<count;i++){
      let p=start+b.readUInt32LE(offset+headerSize+i*4),value;
      if(utf8){let l=b[p++];if(l&128)p++;let bytes=b[p++];if(bytes&128)bytes=((bytes&127)<<8)|b[p++];value=b.toString('utf8',p,p+bytes);}
      else{let l=b.readUInt16LE(p);p+=2;if(l&0x8000){l=((l&0x7fff)<<16)|b.readUInt16LE(p);p+=2;}value=b.toString('utf16le',p,p+l*2);}
      if(replacements[value]){seen.push(value);value=replacements[value];}
      poolNames.push(value);
      if(utf8){const data=Buffer.from(value);strings.push(Buffer.concat([len8(value.length),len8(data.length),data,Buffer.from([0])]));}
      else{const data=Buffer.from(value,'utf16le'),length=Buffer.alloc(2);length.writeUInt16LE(value.length);strings.push(Buffer.concat([length,data,Buffer.alloc(2)]));}
    }
    const header=Buffer.from(chunk.subarray(0,headerSize)),offsets=Buffer.alloc(count*4);let pos=0;
    for(let i=0;i<count;i++){offsets.writeUInt32LE(pos,i*4);pos+=strings[i].length;}
    const data=pad(Buffer.concat(strings));header.writeUInt32LE(headerSize+offsets.length+data.length,4);header.writeUInt32LE(headerSize+offsets.length,20);header.writeUInt32LE(0,24);
    header.writeUInt32LE(flags&~1,16); // replacements invalidate the sorted flag
    chunk=Buffer.concat([header,offsets,data]);
  } else if (type === 0x0102 && poolNames[chunk.readUInt32LE(20)] === 'manifest') {
    chunk = Buffer.from(chunk);
    const start = 16 + chunk.readUInt16LE(24), width = chunk.readUInt16LE(26), count = chunk.readUInt16LE(28);
    for (let i = 0; i < count; i++) {
      const at = start + i * width;
      if (poolNames[chunk.readUInt32LE(at + 4)] === 'versionCode') {
        if (chunk[at + 15] !== 0x10) throw Error('Unexpected versionCode data type');
        chunk.writeUInt32LE(chunk.readUInt32LE(at + 16) + 30, at + 16); versionCodes++;
      }
    }
  }
  chunks.push(chunk);offset+=size;
}
if(seen.length!==4)throw Error('Unexpected manifest: '+JSON.stringify(seen));
if(versionCodes!==1)throw Error('Missing versionCode');
const header=Buffer.from(b.subarray(0,8)),out=Buffer.concat([header,...chunks]);out.writeUInt32LE(out.length,4);
fs.writeFileSync(path.join(root,'verification/AndroidManifest-widemap.xml'),out);
console.log('Manifest: com.john.pokesurvivor.widemap; native Activity remains com.john.pokesurvivor.MainActivity');
