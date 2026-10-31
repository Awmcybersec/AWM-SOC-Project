const fs = require('fs');
const path = require('path');

const size = 256;
const pixelBytes = size * size * 4;
const maskRowBytes = Math.ceil(size / 32) * 4;
const maskBytes = maskRowBytes * size;
const headerSize = 40;
const imageSize = headerSize + pixelBytes + maskBytes;

const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0);
iconDir.writeUInt16LE(1, 2);
iconDir.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry.writeUInt8(size === 256 ? 0 : size, 0);
entry.writeUInt8(size === 256 ? 0 : size, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(imageSize, 8);
entry.writeUInt32LE(6 + 16, 12);

const bmp = Buffer.alloc(imageSize);
// BITMAPINFOHEADER
bmp.writeUInt32LE(40, 0);
bmp.writeInt32LE(size, 4);
bmp.writeInt32LE(size * 2, 8);
bmp.writeUInt16LE(1, 12);
bmp.writeUInt16LE(32, 14);
bmp.writeUInt32LE(0, 16);
bmp.writeUInt32LE(pixelBytes + maskBytes, 20);
bmp.writeInt32LE(0, 24);
bmp.writeInt32LE(0, 28);
bmp.writeUInt32LE(0, 32);
bmp.writeUInt32LE(0, 36);

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const row = size - 1 - y;
    const offset = headerSize + (row * size + x) * 4;
    const r = Math.floor(64 + (191 * x) / (size - 1));
    const g = Math.floor(128 + (127 * y) / (size - 1));
    const b = 220;
    const a = Math.floor((255 * (x + y)) / (2 * (size - 1)));
    bmp[offset] = b;
    bmp[offset + 1] = g;
    bmp[offset + 2] = r;
    bmp[offset + 3] = a;
  }
}

const maskStart = headerSize + pixelBytes;
bmp.fill(0, maskStart, maskStart + maskBytes);

const ico = Buffer.concat([iconDir, entry, bmp]);
const outPath = path.join(__dirname, '..', 'public', 'favicon.ico');
fs.writeFileSync(outPath, ico);
console.log('Created', outPath, ico.length, 'bytes');
