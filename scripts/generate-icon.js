import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

// Tạo icon 180x180 RGBA với gradient xanh Apple và biểu tượng điện thoại/ID ở giữa
const width = 180;
const height = 180;

// Scanline format: mỗi dòng bắt đầu bằng byte 0 (Filter type: None) + width * 4 bytes (RGBA)
const rawData = Buffer.alloc(height * (1 + width * 4));

for (let y = 0; y < height; y++) {
  const rowOffset = y * (1 + width * 4);
  rawData[rowOffset] = 0; // Filter None

  for (let x = 0; x < width; x++) {
    const pxOffset = rowOffset + 1 + x * 4;

    // Gradient background từ #0077ED đến #004DB3
    const t = (x + y) / (width + height);
    let r = Math.round(0 * (1 - t) + 0 * t);
    let g = Math.round(119 * (1 - t) + 77 * t);
    let b = Math.round(237 * (1 - t) + 179 * t);
    let a = 255;

    // Vẽ biểu tượng điện thoại / thẻ ID ở giữa
    // Khung điện thoại: 55 <= x <= 125, 35 <= y <= 145
    const inPhoneOuter = (x >= 55 && x <= 125 && y >= 35 && y <= 145);
    const inPhoneInner = (x >= 61 && x <= 119 && y >= 45 && y <= 135);
    const inHomeBar = (x >= 75 && x <= 105 && y >= 139 && y <= 141);
    const inNotch = (x >= 78 && x <= 102 && y >= 38 && y <= 40);

    // Màn hình bên trong điện thoại: vẽ các vạch ID
    const inLine1 = (x >= 70 && x <= 110 && y >= 65 && y <= 71);
    const inLine2 = (x >= 70 && x <= 100 && y >= 78 && y <= 83);
    const inLine3 = (x >= 70 && x <= 105 && y >= 90 && y <= 95);
    const inBadge = (x >= 78 && x <= 102 && y >= 105 && y <= 117);

    if (inPhoneOuter) {
      if (inHomeBar || inNotch) {
        r = 255; g = 255; b = 255;
      } else if (inPhoneInner) {
        // Màn hình điện thoại trắng nhẹ
        if (inLine1 || inLine2 || inLine3 || inBadge) {
          r = 0; g = 113; b = 227; // vạch xanh
        } else {
          r = 255; g = 255; b = 255; // nền màn hình
        }
      } else {
        // Viền điện thoại trắng
        r = 255; g = 255; b = 255;
      }
    }

    rawData[pxOffset] = r;
    rawData[pxOffset + 1] = g;
    rawData[pxOffset + 2] = b;
    rawData[pxOffset + 3] = a;
  }
}

// Nén IDAT
const compressedData = zlib.deflateSync(rawData);

// Header IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // Bit depth: 8
ihdr[9] = 6; // Color type: RGBA
ihdr[10] = 0; // Compression
ihdr[11] = 0; // Filter
ihdr[12] = 0; // Interlace

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdrChunk = makeChunk('IHDR', ihdr);
const idatChunk = makeChunk('IDAT', compressedData);
const iendChunk = makeChunk('IEND', Buffer.alloc(0));

const pngBuffer = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);

// Lưu ra public/img/icon.png
const publicImgDir = path.join(__dirname, '..', 'public', 'img');
fs.mkdirSync(publicImgDir, { recursive: true });
fs.writeFileSync(path.join(publicImgDir, 'icon.png'), pngBuffer);

// Sinh file mobileconfig template
const base64Png = pngBuffer.toString('base64');
const mobileconfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadIdentifier</key>
      <string>vn.softdreams.udid.webclip</string>
      <key>PayloadUUID</key>
      <string>9F8706EA-7BF2-4876-805C-F02A0B7FBE1A</string>
      <key>PayloadDisplayName</key>
      <string>Lấy UDID</string>
      <key>PayloadDescription</key>
      <string>Lối tắt Safari lấy UDID thiết bị</string>
      <key>URL</key>
      <string>{{BASE_URL}}</string>
      <key>Label</key>
      <string>Lấy UDID</string>
      <key>FullScreen</key>
      <false/>
      <key>IsRemovable</key>
      <true/>
      <key>Icon</key>
      <data>${base64Png}</data>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>Lấy UDID Web Clip</string>
  <key>PayloadIdentifier</key>
  <string>vn.softdreams.udid.webclip.profile</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>E71825B9-5735-4309-8F2D-BF6D649BA833</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadOrganization</key>
  <string>Softdreams</string>
  <key>PayloadDescription</key>
  <string>Lối tắt lấy UDID thiết bị trên màn hình chính (mở qua Safari)</string>
</dict>
</plist>
`;

const certsDir = path.join(__dirname, '..', 'certs');
fs.mkdirSync(certsDir, { recursive: true });
fs.writeFileSync(path.join(certsDir, 'webclip.mobileconfig'), mobileconfigContent, 'utf8');

console.log('Đã tạo thành công:');
console.log('- public/img/icon.png (180x180)');
console.log('- certs/webclip.mobileconfig (có Icon base64, FullScreen=false)');
