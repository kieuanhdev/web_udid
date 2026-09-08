import { spawn } from 'node:child_process';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PORT = 3010;

console.log('=== BẮT ĐẦU KIỂM THỬ TÍCH HỢP HTTP SERVER ===\n');

const env = {
  ...process.env,
  PORT: String(TEST_PORT),
  BASE_URL: 'https://udid.kieuanhdev.id.vn'
};

const serverProcess = spawn('node', ['src/server.js'], {
  cwd: path.join(__dirname, '..'),
  env
});

let serverLogs = '';
serverProcess.stdout.on('data', (d) => {
  serverLogs += d.toString();
});
serverProcess.stderr.on('data', (d) => {
  serverLogs += d.toString();
});

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request(urlPath, options = {}) {
  const res = await fetch(`http://127.0.0.1:${TEST_PORT}${urlPath}`, options);
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text };
}

try {
  // Chờ server khởi động
  await wait(1000);

  // 1. GET /health
  console.log('[1/8] Kiểm tra GET & HEAD /health...');
  const healthRes = await request('/health');
  assert.strictEqual(healthRes.status, 200);
  assert.deepStrictEqual(JSON.parse(healthRes.body), { ok: true });

  const healthHeadRes = await request('/health', { method: 'HEAD' });
  assert.strictEqual(healthHeadRes.status, 200);
  assert.strictEqual(healthHeadRes.body, '');
  console.log('✓ /health (GET & HEAD) trả về 200 OK!\n');

  // 2. GET / (Trang chủ)
  console.log('[2/8] Kiểm tra GET /...');
  const homeRes = await request('/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    }
  });
  assert.strictEqual(homeRes.status, 200);
  assert.ok(homeRes.body.includes('Lấy UDID thiết bị iOS'), 'Trang chủ phải chứa tiêu đề chính');
  assert.ok(homeRes.body.includes('step1.png'), 'Trang chủ phải chứa ảnh minh họa step1.png');
  assert.ok(homeRes.body.includes('/enroll?t='), 'Trang chủ phải chứa link enroll kèm token');
  assert.ok(
    homeRes.body.includes("isSafariIOS = 'true' === 'true'") || homeRes.body.includes('isSafariIOS = true'),
    'Safari trên iOS phải nhận cờ isSafariIOS = true'
  );

  // Trích xuất token được render trên trang chủ
  const tokenMatch = homeRes.body.match(/\/enroll\?t=([a-f0-9]{32})/);
  assert.ok(tokenMatch, 'Phải sinh và nhúng token vào nút lấy UDID');
  const token = tokenMatch[1];
  console.log(`✓ GET / render thành công với token: ${token}\n`);

  // 3. GET /enroll?t=TOKEN
  console.log('[3/8] Kiểm tra GET /enroll?t=...');
  const enrollRes = await request(`/enroll?t=${token}`);
  assert.strictEqual(enrollRes.status, 200);
  assert.strictEqual(enrollRes.headers.get('content-type'), 'application/x-apple-aspen-config');
  assert.ok(enrollRes.body.includes('Profile Service'));
  assert.ok(enrollRes.body.includes(token));
  console.log('✓ GET /enroll trả về đúng MIME Profile Service và token!\n');

  // 4. GET /webclip
  console.log('[4/8] Kiểm tra GET /webclip...');
  const webclipRes = await request('/webclip');
  assert.strictEqual(webclipRes.status, 200);
  assert.strictEqual(webclipRes.headers.get('content-type'), 'application/x-apple-aspen-config');
  assert.ok(webclipRes.body.includes('com.apple.webClip.managed'));
  assert.ok(webclipRes.body.includes('<false/>'), 'FullScreen phải bằng false để mở bằng Safari');
  console.log('✓ GET /webclip trả về cấu hình Web Clip hợp lệ (FullScreen=false)!\n');

  // 5. GET Static CSS
  console.log('[5/8] Kiểm tra GET /style.css...');
  const cssRes = await request('/style.css');
  assert.strictEqual(cssRes.status, 200);
  assert.strictEqual(cssRes.headers.get('content-type'), 'text/css');
  console.log('✓ Phục vụ file CSS thành công!\n');

  // 6. GET Static Step Images
  console.log('[6/8] Kiểm tra GET /img/step1.png đến step4.png...');
  for (let i = 1; i <= 4; i++) {
    const pngRes = await request(`/img/step${i}.png`);
    assert.strictEqual(pngRes.status, 200);
    assert.strictEqual(pngRes.headers.get('content-type'), 'image/png');
  }
  console.log('✓ Phục vụ đủ 4 hình ảnh minh họa thực tế PNG!\n');

  // 7. GET Static icon.png
  console.log('[7/8] Kiểm tra GET /img/icon.png...');
  const iconRes = await request('/img/icon.png');
  assert.strictEqual(iconRes.status, 200);
  assert.strictEqual(iconRes.headers.get('content-type'), 'image/png');
  console.log('✓ Phục vụ App Icon PNG thành công!\n');

  // 8. GET /result?t=TOKEN (chưa có kết quả hoặc hết hạn)
  console.log('[8/8] Kiểm tra GET /result...');
  const resultRes = await request(`/result?t=${token}`);
  assert.strictEqual(resultRes.status, 200);
  assert.ok(resultRes.body.includes('Không tìm thấy kết quả'));
  console.log('✓ Xử lý trang kết quả chính xác khi token chưa có data!\n');

  console.log('=== TẤT CẢ ROUTE VÀ TÀI NGUYÊN ĐÃ ĐƯỢC XÁC THỰC THÀNH CÔNG! ===');
} finally {
  serverProcess.kill('SIGTERM');
}
