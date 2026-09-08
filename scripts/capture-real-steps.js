import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const imgDir = path.join(publicDir, 'img');
const tempDir = path.join(__dirname, '..', 'scratch');
fs.mkdirSync(tempDir, { recursive: true });

// Common CSS for iOS System screens
const iosBaseCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Helvetica, Arial, sans-serif;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 0;
  }
  .iphone-screen {
    width: 393px;
    height: 440px;
    background: #F2F2F7;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  /* Status bar */
  .status-bar {
    height: 48px;
    padding: 12px 24px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #000;
    z-index: 10;
  }
  .dynamic-island {
    width: 120px;
    height: 32px;
    background: #000;
    border-radius: 20px;
    margin: 0 auto;
    position: absolute;
    left: calc(50% - 60px);
    top: 10px;
  }
  .status-icons {
    display: flex;
    gap: 6px;
    align-items: center;
  }
`;

// 1. STEP 1: Safari prompt
const step1Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.safari-bg {
  position: absolute;
  inset: 0;
  background: #0D1117;
  filter: brightness(0.4) blur(2px);
}
.dimmed {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.38);
  z-index: 5;
}
.ios-alert {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -46%);
  width: 290px;
  background: rgba(248, 248, 248, 0.94);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  z-index: 20;
  text-align: center;
}
.alert-content {
  padding: 22px 18px 20px;
}
.alert-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 6px;
}
.alert-desc {
  font-size: 13px;
  color: #3C3C43;
  line-height: 1.4;
}
.alert-actions {
  display: flex;
  border-top: 0.5px solid rgba(60,60,67,0.24);
}
.alert-btn {
  flex: 1;
  padding: 13px 0;
  font-size: 16px;
  color: #007AFF;
  background: transparent;
  border: none;
  font-family: inherit;
  cursor: pointer;
}
.alert-btn.bold {
  font-weight: 700;
  border-left: 0.5px solid rgba(60,60,67,0.24);
  background: rgba(0, 122, 255, 0.12);
  position: relative;
}
.pulse-badge {
  position: absolute;
  right: 14px;
  top: -12px;
  background: #FF3B30;
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
  box-shadow: 0 3px 8px rgba(255,59,48,0.45);
  white-space: nowrap;
}
</style>
</head>
<body>
<div class="iphone-screen">
  <div class="safari-bg">
    <div style="padding: 100px 20px; color:#fff; text-align:center;">
      <h2 style="font-size:20px;color:#EA5626;">iOS UDID — SoftDreams</h2>
      <p style="margin-top:10px;font-size:13px;opacity:0.7;">Đang yêu cầu hồ sơ cấu hình...</p>
    </div>
  </div>
  <div class="dimmed"></div>
  <div class="status-bar" style="color: #fff;">
    <span>9:41</span>
    <div class="dynamic-island"></div>
    <div class="status-icons">
      <svg width="15" height="11" viewBox="0 0 17 12" fill="#fff"><path d="M1 9.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4.5-3a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4.5-3a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm4.5-3a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/></svg>
      <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
      <svg width="22" height="11" viewBox="0 0 25 12" fill="#fff"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5"/><path d="M23 4.5v3" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="ios-alert">
    <div class="alert-content">
      <div class="alert-title">Tải về hồ sơ cấu hình</div>
      <div class="alert-desc">Trang web này đang cố tải về một hồ sơ cấu hình. Bạn có muốn cho phép không?</div>
    </div>
    <div class="alert-actions">
      <div class="alert-btn">Bỏ qua</div>
      <div class="alert-btn bold">
        Cho phép
        <span class="pulse-badge">BẤM VÀO ĐÂY</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

// 2. STEP 2: iOS Settings screen
const step2Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.settings-header {
  padding: 8px 18px 12px;
}
.settings-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #000;
}
.search-bar {
  margin-top: 8px;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 10px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8E8E93;
  font-size: 15px;
}
.settings-group {
  margin: 0 16px 14px;
  background: #FFF;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8E8E93, #636366);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}
.profile-info h4 { font-size: 16px; font-weight: 600; color: #000; }
.profile-info p { font-size: 12px; color: #8E8E93; margin-top: 1px; }

/* Highlight row "Đã tải về hồ sơ" */
.highlight-row {
  margin: 0 16px 14px;
  background: #FFF;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #007AFF;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.18);
  position: relative;
}
.download-icon {
  width: 32px;
  height: 32px;
  background: #007AFF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.row-label {
  flex: 1;
  font-size: 15.5px;
  font-weight: 700;
  color: #000;
}
.row-arrow {
  color: #C7C7CC;
  font-size: 18px;
  font-weight: 600;
}
.action-tag {
  background: #FF3B30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
}
</style>
</head>
<body>
<div class="iphone-screen">
  <div class="status-bar">
    <span>9:41</span>
    <div class="dynamic-island"></div>
    <div class="status-icons">
      <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
      <svg width="22" height="11" viewBox="0 0 25 12" fill="#000"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#000" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5"/><path d="M23 4.5v3" stroke="#000" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="settings-header">
    <div class="settings-title">Cài đặt</div>
    <div class="search-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <span>Tìm kiếm</span>
    </div>
  </div>

  <div class="settings-group">
    <div class="profile-card">
      <div class="avatar">KD</div>
      <div class="profile-info">
        <h4>Kieu Anh</h4>
        <p>Apple ID, iCloud, Phương tiện & Mua hàng</p>
      </div>
    </div>
  </div>

  <div class="highlight-row">
    <div class="download-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    </div>
    <div class="row-label">Đã tải về hồ sơ</div>
    <span class="action-tag">CHỌN MỤC NÀY</span>
    <div class="row-arrow">›</div>
  </div>

</div>
</body>
</html>`;

// 3. STEP 3: iOS Install Profile screen
const step3Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.nav-bar {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 0.5px solid rgba(60,60,67,0.18);
  background: #F2F2F7;
}
.nav-btn {
  font-size: 16px;
  color: #007AFF;
  font-family: inherit;
  background: none;
  border: none;
  cursor: pointer;
}
.nav-btn.bold {
  font-weight: 700;
  background: #007AFF;
  color: #fff;
  padding: 6px 14px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,122,255,0.4);
}
.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}
.content-area {
  padding: 16px;
}
.profile-header-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.profile-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: linear-gradient(135deg, #EA5626, #F27A54);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(234,86,38,0.3);
}
.profile-header-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: #000;
}
.profile-header-card p {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 2px;
}
.verified-tag {
  font-size: 12px;
  color: #34C759;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  margin-top: 4px;
}
.section-desc {
  margin: 14px 4px 6px;
  font-size: 12px;
  color: #6C6C70;
  text-transform: uppercase;
}
.profile-details-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.detail-item {
  font-size: 13px;
  color: #3C3C43;
  line-height: 1.5;
}
</style>
</head>
<body>
<div class="iphone-screen">
  <div class="status-bar">
    <span>9:41</span>
    <div class="dynamic-island"></div>
    <div class="status-icons">
      <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
      <svg width="22" height="11" viewBox="0 0 25 12" fill="#000"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#000" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5"/><path d="M23 4.5v3" stroke="#000" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="nav-bar">
    <div class="nav-btn">Hủy</div>
    <div class="nav-title">Cài đặt cấu hình</div>
    <div class="nav-btn bold">Cài đặt</div>
  </div>

  <div class="content-area">
    <div class="profile-header-card">
      <div class="profile-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="3" ry="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
      </div>
      <div>
        <h3>Lấy mã UDID thiết bị</h3>
        <p>SoftDreams JSC</p>
        <div class="verified-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          Hồ sơ đăng ký OTA Apple
        </div>
      </div>
    </div>

    <div class="section-desc">Mô tả hồ sơ</div>
    <div class="profile-details-card">
      <div class="detail-item">Hồ sơ cấu hình hỗ trợ trích xuất mã nhận dạng UDID phục vụ đăng ký kiểm thử ứng dụng nội bộ. Tự động thu hồi ngay sau khi xong.</div>
    </div>
  </div>
</div>
</body>
</html>`;

// 4. STEP 4: Real Web Result Screen with iOS Status bar & Safari frame
const step4Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.result-header {
  background: #0D1117;
  padding: 10px 16px 16px;
  text-align: center;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ADE80;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 6px;
}
.result-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.card-wrap {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hero-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  overflow: hidden;
}
.hero-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #F1F5F9;
  background: #FAFAFA;
}
.device-box {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: rgba(234,86,38,0.1);
  color: #EA5626;
  display: flex; align-items: center; justify-content: center;
}
.device-name { font-size: 13.5px; font-weight: 700; color: #1E293B; }
.ver-badge { font-size: 11px; font-weight: 700; color: #fff; background: #EA5626; padding: 1px 6px; border-radius: 6px; margin-left: 4px; }
.code-box {
  padding: 12px 14px;
}
.code-label {
  display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #EA5626; text-transform: uppercase; margin-bottom: 6px;
}
.udid-str {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  font-weight: 700;
  color: #0F172A;
  background: #F1F5F9;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  text-align: center;
  letter-spacing: 0.02em;
}
.copy-btn {
  margin-top: 10px;
  width: 100%;
  background: linear-gradient(135deg, #EA5626, #C43B10);
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 11px 0;
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 14px rgba(234,86,38,0.35);
}
.actions-row {
  display: flex;
  gap: 8px;
  padding: 0 14px 12px;
  border-top: 1px solid #F1F5F9;
  padding-top: 10px;
}
.act-btn {
  flex: 1;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
  border-radius: 8px;
  padding: 7px 0;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}
</style>
</head>
<body>
<div class="iphone-screen" style="background:#F8FAFC;">
  <div class="status-bar" style="background:#0D1117;color:#fff;">
    <span>9:41</span>
    <div class="dynamic-island"></div>
    <div class="status-icons">
      <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
      <svg width="22" height="11" viewBox="0 0 25 12" fill="#fff"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5"/><path d="M23 4.5v3" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="result-header">
    <div class="result-badge">✓ Thành công</div>
    <div class="result-title">Lấy mã UDID thiết bị</div>
  </div>

  <div class="card-wrap">
    <div class="hero-card">
      <div class="hero-top">
        <div class="device-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        </div>
        <div>
          <span class="device-name">iPhone 15 Pro</span>
          <span class="ver-badge">17.5.1</span>
        </div>
      </div>

      <div class="code-box">
        <div class="code-label">
          <span>Mã UDID thiết bị</span>
          <span>25 ký tự</span>
        </div>
        <code class="udid-str">00008110-001234560E02801E</code>
        <button class="copy-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Sao chép UDID
        </button>
      </div>

      <div class="actions-row">
        <div class="act-btn">Sao chép tất cả</div>
        <div class="act-btn">Chia sẻ</div>
        <div class="act-btn">QR Code</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

fs.writeFileSync(path.join(tempDir, 'step1.html'), step1Html);
fs.writeFileSync(path.join(tempDir, 'step2.html'), step2Html);
fs.writeFileSync(path.join(tempDir, 'step3.html'), step3Html);
fs.writeFileSync(path.join(tempDir, 'step4.html'), step4Html);

console.log('HTML files created in scratch/');
