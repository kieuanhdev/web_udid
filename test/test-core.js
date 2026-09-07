import assert from 'node:assert';
import { createSession, saveResult, takeResult } from '../src/store.js';
import { buildEnrollProfile } from '../src/mobileconfig.js';
import { extractAttributes } from '../src/pkcs7.js';
import { isSafariIOS } from '../src/ua.js';
import { getDeviceModelName } from '../src/devices.js';

console.log('=== BẮT ĐẦU KIỂM THỬ CORE (PHASE 1 -> 3) ===\n');

// 1. Kiểm thử UA detector (ua.js)
console.log('[1/4] Kiểm thử detect Safari iOS (src/ua.js)...');
const uaIOSSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const uaIOSChrome = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.108 Mobile/15E148 Safari/604.1';
const uaIOSZalo = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo/24.06.01';
const uaDesktopMac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

assert.strictEqual(isSafariIOS(uaIOSSafari), true, 'Safari trên iOS phải trả về true');
assert.strictEqual(isSafariIOS(uaIOSChrome), false, 'Chrome trên iOS (CriOS) phải trả về false');
assert.strictEqual(isSafariIOS(uaIOSZalo), false, 'Zalo webview phải trả về false');
assert.strictEqual(isSafariIOS(uaDesktopMac), false, 'Desktop Chrome phải trả về false');
console.log('✓ Detect User-Agent hoạt động chính xác!\n');

// 2. Kiểm thử Token Store (store.js)
console.log('[2/5] Kiểm thử Token Store (src/store.js)...');
const token = createSession();
assert.ok(token && typeof token === 'string' && token.length === 32, 'createSession phải sinh hex 32 ký tự');

// Lưu data
const testData = {
  udid: '00008110-001234567890ABCD',
  product: 'iPhone16,2',
  version: '18.2',
  serial: 'DNQW1234XYZ'
};
const saveOk = saveResult(token, testData);
assert.strictEqual(saveOk, true, 'saveResult với token hợp lệ phải trả về true');

// Đọc kết quả lần 1 (mô phỏng tiến trình nền iOS ping trước)
const retrieved = takeResult(token);
assert.deepStrictEqual(retrieved, testData, 'takeResult lần 1 phải lấy đúng dữ liệu đã lưu');

// Đọc kết quả lần 2 (mô phỏng Safari mở lên hoặc reload)
const readAgain = takeResult(token);
assert.deepStrictEqual(readAgain, testData, 'takeResult lần 2 vẫn phải giữ dữ liệu trong suốt TTL');
console.log('✓ Token Store (an toàn cho iOS redirect & Safari) hoạt động chính xác!\n');

// 3. Kiểm thử sinh Profile Service (mobileconfig.js)
console.log('[3/4] Kiểm thử sinh Profile Service (src/mobileconfig.js)...');
const sampleBaseUrl = 'https://udid.kieuanhdev.id.vn';
const xmlProfile = buildEnrollProfile({ token: 'test-token-1234', baseUrl: sampleBaseUrl });

assert.ok(xmlProfile.includes('Profile Service'), 'Profile phải có PayloadType Profile Service');
assert.ok(xmlProfile.includes(`${sampleBaseUrl}/callback`), 'Profile phải chứa callback URL chính xác');
assert.ok(xmlProfile.includes('<string>test-token-1234</string>'), 'Profile phải chứa Challenge token');
assert.ok(xmlProfile.includes('UDID') && xmlProfile.includes('PRODUCT'), 'Profile phải yêu cầu UDID và PRODUCT');
console.log('✓ Sinh Profile Service XML hoạt động chính xác!\n');

// 4. Kiểm thử trích xuất thuộc tính PKCS#7 (pkcs7.js)
console.log('[4/4] Kiểm thử bóc tách thuộc tính thiết bị (src/pkcs7.js)...');
// Tạo buffer XML plist mô phỏng payload mà daemon iOS gửi về
const mockPlistXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CHALLENGE</key>
  <string>test-token-challenge-999</string>
  <key>PRODUCT</key>
  <string>iPhone15,2</string>
  <key>SERIAL</key>
  <string>FX9921008ABCD</string>
  <key>UDID</key>
  <string>00008030-001A2B3C4D5E6F70</string>
  <key>VERSION</key>
  <string>21A329</string>
</dict>
</plist>`;

const mockBuffer = Buffer.from(mockPlistXml, 'utf8');
const extracted = extractAttributes(mockBuffer);

assert.strictEqual(extracted.token, 'test-token-challenge-999');
assert.strictEqual(extracted.udid, '00008030-001A2B3C4D5E6F70');
assert.strictEqual(extracted.product, 'iPhone15,2');
assert.strictEqual(extracted.serial, 'FX9921008ABCD');
console.log('✓ Trích xuất UDID, Challenge, Model từ payload hoạt động chính xác!\n');

// 5. Kiểm thử bảng mapping model thiết bị (devices.js)
console.log('[5/5] Kiểm thử ánh xạ tên thương mại Apple (src/devices.js)...');
assert.strictEqual(getDeviceModelName('iPhone11,6'), 'iPhone XS Max', 'iPhone11,6 phải map thành iPhone XS Max');
assert.strictEqual(getDeviceModelName('iPhone15,2'), 'iPhone 14 Pro', 'iPhone15,2 phải map thành iPhone 14 Pro');
assert.strictEqual(getDeviceModelName('iPhone16,2'), 'iPhone 15 Pro Max', 'iPhone16,2 phải map thành iPhone 15 Pro Max');
assert.strictEqual(getDeviceModelName('iPhone17,2'), 'iPhone 16 Pro Max', 'iPhone17,2 phải map thành iPhone 16 Pro Max');
assert.strictEqual(getDeviceModelName('UnknownHardware1,1'), 'UnknownHardware1,1', 'Thiết bị lạ giữ nguyên mã');
console.log('✓ Bảng ánh xạ Model Apple hoạt động chính xác!\n');

console.log('=== TẤT CẢ KIỂM THỬ ĐÃ VƯỢT QUA THÀNH CÔNG! ===');
