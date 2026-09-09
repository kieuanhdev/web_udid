import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSession, saveResult, getResult } from './store.js';
import { buildEnrollProfile } from './mobileconfig.js';
import { extractAttributes } from './pkcs7.js';
import { isSafariIOS } from './ua.js';
import { getDeviceModelName } from './devices.js';

// Tự động nạp .env nếu process.env.BASE_URL chưa được thiết lập
if (!process.env.BASE_URL) {
  try {
    process.loadEnvFile?.();
  } catch {
    // Không có file .env hoặc đã được truyền từ môi trường bên ngoài
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CERTS_DIR = path.join(__dirname, '..', 'certs');

const rawBaseUrl = (process.env.BASE_URL || '').trim();
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');
const PORT = Number(process.env.PORT) || 3005;

if (!BASE_URL) {
  console.error('Thiếu BASE_URL trong .env — dừng server.');
  process.exit(1);
}

// ---- helpers ----

async function sendFile(res, filePath, contentType, cacheControl = 'no-store', isHead = false) {
  try {
    const fileStat = await stat(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileStat.size,
      'Cache-Control': cacheControl,
    });
    if (isHead) {
      res.end();
      return;
    }
    const buf = await readFile(filePath);
    res.end(buf);
  } catch {
    res.writeHead(404).end('Not found');
  }
}

function sendJson(res, code, obj, isHead = false) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  if (isHead) {
    res.end();
  } else {
    res.end(JSON.stringify(obj));
  }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const MAX = 1024 * 1024; // 1MB — payload PKCS#7 thật rất nhỏ, chặn body bất thường

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---- route handlers ----

async function handleHome(req, res) {
  const ua = req.headers['user-agent'] || '';
  const token = createSession();
  const html = await readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf8');

  const rendered = html
    .replaceAll('{{TOKEN}}', token)
    .replaceAll('{{IS_SAFARI_IOS}}', isSafariIOS(ua) ? 'true' : 'false');

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(rendered);
}

async function handleEnroll(req, res, url) {
  const token = url.searchParams.get('t');
  if (!token) {
    res.writeHead(400).end('Thiếu token');
    return;
  }

  const xml = buildEnrollProfile({ token, baseUrl: BASE_URL });

  res.writeHead(200, {
    'Content-Type': 'application/x-apple-aspen-config',
    'Content-Disposition': 'attachment; filename="enroll.mobileconfig"',
    'Cache-Control': 'no-store, private',
  });
  res.end(xml);
}

async function handleCallback(req, res) {
  let buffer;
  try {
    buffer = await readRawBody(req);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (!buffer || buffer.length === 0) {
    res.writeHead(400).end('Payload rỗng');
    return;
  }

  let attrs;
  try {
    attrs = extractAttributes(buffer);
  } catch (err) {
    console.error('Parse PKCS#7 lỗi:', err.message);
    res.writeHead(400).end('Không đọc được payload');
    return;
  }

  const { token, udid, product, version, serial } = attrs;
  if (!token || !udid) {
    res.writeHead(400).end('Payload thiếu dữ liệu');
    return;
  }

  const friendlyModel = getDeviceModelName(product);
  const modelDisplay = product && friendlyModel !== product ? `${friendlyModel} (${product})` : (friendlyModel || 'N/A');

  console.log('\n========================================');
  console.log('🎉 [MỚI NHẬN ĐƯỢC UDID TỪ THIẾT BỊ]');
  console.log(`📱 Model:     ${modelDisplay}`);
  console.log(`⚙️  iOS:       ${version || 'N/A'}`);
  console.log(`🔑 Serial:    ${serial || 'N/A'}`);
  console.log(`🎯 UDID:      ${udid}`);
  console.log(`⏱️  Thời gian: ${new Date().toLocaleString('vi-VN')}`);
  console.log('========================================\n');

  saveResult(token, { udid, product, version, serial });

  // Theo chuẩn Apple OTA Profile Service, server BẮT BUỘC phải dùng 301 Moved Permanently
  // để iOS tự động đóng màn hình Cài đặt và chuyển sang Safari mở trang kết quả.
  res.writeHead(301, {
    Location: `${BASE_URL}/result?t=${token}`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
  });
  res.end();
}

async function handleResult(req, res, url) {
  const token = url.searchParams.get('t');
  const isDemo = url.searchParams.get('demo') === '1' || url.searchParams.get('mock') === '1';

  let data = token ? getResult(token) : null;
  if (!data && isDemo) {
    data = {
      udid: '00008110-001234560E02801E',
      product: 'iPhone16,1',
      version: '17.5.1',
      serial: 'F17DTEST0001',
    };
  }

  const friendlyModel = data?.product ? getDeviceModelName(data.product) : '';

  const html = await readFile(path.join(PUBLIC_DIR, 'result.html'), 'utf8');

  const rendered = html
    .replaceAll('{{FOUND}}', data ? 'true' : 'false')
    .replaceAll('{{UDID}}', data?.udid ?? '')
    .replaceAll('{{PRODUCT}}', friendlyModel || (data?.product ?? ''))
    .replaceAll('{{RAW_PRODUCT}}', data?.product ?? '')
    .replaceAll('{{VERSION}}', data?.version ?? '');

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(rendered);
}

async function handleWebclip(req, res) {
  const signedPath = path.join(CERTS_DIR, 'webclip.signed.mobileconfig');
  const unsignedPath = path.join(CERTS_DIR, 'webclip.mobileconfig');

  try {
    let buf;
    try {
      buf = await readFile(signedPath);
      if (buf.length === 0) throw new Error('Signed file is empty');
    } catch {
      // Fallback sang unsigned mobileconfig template nếu chưa ký cert trả phí
      const template = await readFile(unsignedPath, 'utf8');
      const rendered = template.replaceAll('{{BASE_URL}}', BASE_URL);
      buf = Buffer.from(rendered, 'utf8');
    }

    res.writeHead(200, {
      'Content-Type': 'application/x-apple-aspen-config',
      'Content-Disposition': 'attachment; filename="webclip.mobileconfig"',
      'Cache-Control': 'no-store, private',
    });
    res.end(buf);
  } catch (err) {
    console.error('Lỗi khi tải Webclip:', err.message);
    res.writeHead(500).end('Không thể tải profile Web Clip');
  }
}

async function handleStatic(req, res, pathname) {
  // chỉ phục vụ những gì trong /public, chặn path traversal
  const rel = pathname.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  const ext = path.extname(filePath);
  const types = {
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
  };

  const isCacheable = pathname.startsWith('/img/') || pathname === '/robots.txt';
  const cacheControl = isCacheable ? 'public, max-age=86400' : 'no-cache';
  const isHead = req.method === 'HEAD';

  await sendFile(res, filePath, types[ext] || 'application/octet-stream', cacheControl, isHead);
}

// ---- router ----

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, BASE_URL);
  } catch {
    res.writeHead(400).end('Bad URL');
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/') return handleHome(req, res);
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true }, req.method === 'HEAD');
    }
    if (req.method === 'GET' && url.pathname === '/enroll') return handleEnroll(req, res, url);
    if (req.method === 'POST' && url.pathname === '/callback') return handleCallback(req, res);
    if (req.method === 'GET' && url.pathname === '/result') return handleResult(req, res, url);
    if (req.method === 'GET' && url.pathname === '/webclip') return handleWebclip(req, res);

    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/favicon.ico') {
      res.writeHead(302, { Location: '/img/icon.png' });
      res.end();
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && /^\/(style\.css|robots\.txt|img\/)/.test(url.pathname)) {
      return handleStatic(req, res, url.pathname);
    }

    res.writeHead(404).end('Not found');
  } catch (err) {
    console.error('Unhandled error:', err);
    if (!res.headersSent) res.writeHead(500).end('Internal error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`iOS UDID web listening on 0.0.0.0:${PORT}, BASE_URL=${BASE_URL}`);
});

function gracefulShutdown(signal) {
  console.log(`\nNhận tín hiệu ${signal}, đang đóng server an toàn...`);
  server.close(() => {
    console.log('Server đã đóng kết nối.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Đóng server quá thời gian, buộc dừng tiến trình.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));