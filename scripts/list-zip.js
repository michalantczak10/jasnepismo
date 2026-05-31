#!/usr/bin/env node
// Lightweight ZIP central directory lister (no external deps)
// Usage: node scripts/list-zip.js <zipfile>
const fs = require('fs');
const path = require('path');

function readUInt32LE(buf, off) {
  return buf.readUInt32LE(off);
}
function readUInt16LE(buf, off) {
  return buf.readUInt16LE(off);
}

function listZip(filePath) {
  const buf = fs.readFileSync(filePath);
  const len = buf.length;
  // Search for End of Central Directory (EOCD) signature: 0x06054b50 'PK\x05\x06'
  const sig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const maxComment = 0xffff; // 65535
  const startSearch = Math.max(0, len - (22 + maxComment) - 1);
  let eocdOff = -1;
  for (let i = len - 22; i >= startSearch; i--) {
    if (
      buf[i] === sig[0] &&
      buf[i + 1] === sig[1] &&
      buf[i + 2] === sig[2] &&
      buf[i + 3] === sig[3]
    ) {
      eocdOff = i;
      break;
    }
  }
  if (eocdOff === -1) {
    console.error('EOCD not found in', filePath);
    process.exit(2);
  }
  const totalEntries = readUInt16LE(buf, eocdOff + 10);
  const centralDirSize = readUInt32LE(buf, eocdOff + 12);
  const centralDirOffset = readUInt32LE(buf, eocdOff + 16);
  // iterate central dir
  let off = centralDirOffset;
  const files = [];
  for (let i = 0; i < totalEntries && off + 46 <= buf.length; i++) {
    const cSig = buf.readUInt32LE(off);
    if (cSig !== 0x02014b50) {
      // not central dir header -- stop
      break;
    }
    const compressedSize = readUInt32LE(buf, off + 20);
    const uncompressedSize = readUInt32LE(buf, off + 24);
    const nameLen = readUInt16LE(buf, off + 28);
    const extraLen = readUInt16LE(buf, off + 30);
    const commentLen = readUInt16LE(buf, off + 32);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString('utf8');
    files.push({ name, compressedSize, uncompressedSize });
    off += 46 + nameLen + extraLen + commentLen;
  }
  for (const f of files) {
    console.log(
      f.compressedSize.toString().padStart(10),
      f.uncompressedSize.toString().padStart(10),
      f.name
    );
  }
}

if (require.main === module) {
  const f = process.argv[2];
  if (!f) {
    console.error('Usage: node scripts/list-zip.js <zipfile>');
    process.exit(1);
  }
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) {
    console.error('File not found:', p);
    process.exit(1);
  }
  listZip(p);
}
