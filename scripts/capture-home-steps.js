import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '..', 'scratch');
fs.mkdirSync(tempDir, { recursive: true });

const iosBaseCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Helvetica, Arial, sans-serif;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
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
  .status-bar {
    height: 48px;
    padding: 12px 24px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    z-index: 10;
    background: #0D1117;
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

// 1. HOME STEP 1: Safari Bottom Toolbar with Share Button Highlighted
const homeStep1Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.page-mock {
  flex: 1;
  background: #0D1117;
  padding: 30px 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.page-mock h3 { font-size: 18px; color: #EA5626; margin-bottom: 8px; }
.page-mock p { font-size: 13px; color: #94A3B8; }

/* Safari bottom toolbar */
.safari-toolbar {
  height: 80px;
  background: rgba(24, 24, 27, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 16px 14px;
  position: relative;
}
.tb-btn {
  color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}
.tb-btn.disabled {
  color: #545458;
}

/* Highlighted Share Button */
.share-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.share-highlight {
  width: 50px;
  height: 50px;
  background: rgba(0, 122, 255, 0.2);
  border: 2px solid #007AFF;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 16px rgba(0, 122, 255, 0.6);
}
.share-tag {
  position: absolute;
  top: -34px;
  background: #FF3B30;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(255,59,48,0.5);
}
.share-tag::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #FF3B30;
}
</style>
</head>
<body>
<div class="iphone-screen">
  <div class="status-bar">
    <span>9:41</span>
    <div class="dynamic-island"></div>
    <div class="status-icons">
      <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
      <svg width="22" height="11" viewBox="0 0 25 12" fill="#fff"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5"/><path d="M23 4.5v3" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="page-mock">
    <h3>Lấy UDID thiết bị iOS</h3>
    <p>Trang web đang mở trên Safari</p>
    <div style="margin-top:20px;font-size:12px;color:#64748B;">Nhìn xuống thanh công cụ dưới cùng:</div>
  </div>

  <div class="safari-toolbar">
    <div class="tb-btn disabled">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 18-6-6 6-6"/></svg>
    </div>
    <div class="tb-btn disabled">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>
    </div>

    <!-- Nút chia sẻ ở giữa được làm nổi bật -->
    <div class="share-wrap">
      <div class="share-tag">BẤM NÚT NÀY</div>
      <div class="share-highlight">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </div>
    </div>

    <div class="tb-btn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    </div>
    <div class="tb-btn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
    </div>
  </div>
</div>
</body>
</html>`;

// 2. HOME STEP 2: iOS Share Sheet - "Thêm vào Màn hình chính"
const homeStep2Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.sheet-bg {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
}
.share-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #F2F2F7;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 10px 16px 24px;
  box-shadow: 0 -8px 30px rgba(0,0,0,0.3);
}
.sheet-handle {
  width: 36px;
  height: 5px;
  background: #C7C7CC;
  border-radius: 3px;
  margin: 0 auto 12px;
}
.sheet-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #FFF;
  border-radius: 12px;
  margin-bottom: 14px;
}
.preview-icon {
  width: 38px; height: 38px;
  background: #EA5626;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 16px;
}
.preview-text h4 { font-size: 14px; font-weight: 600; color: #000; }
.preview-text p { font-size: 12px; color: #8E8E93; }

.sheet-actions {
  background: #FFF;
  border-radius: 12px;
  overflow: hidden;
}
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  border-bottom: 0.5px solid rgba(60,60,67,0.18);
  font-size: 15px;
  color: #000;
}
.action-row:last-child { border-bottom: none; }
.action-row.highlighted {
  background: rgba(0, 122, 255, 0.08);
  border: 2px solid #007AFF;
  border-radius: 12px;
  margin: -1px;
  position: relative;
}
.action-tag {
  background: #FF3B30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  margin-right: 8px;
}
</style>
</head>
<body>
<div class="iphone-screen">
  <div class="sheet-bg"></div>

  <div class="share-sheet">
    <div class="sheet-handle"></div>

    <div class="sheet-preview">
      <div class="preview-icon">UDID</div>
      <div class="preview-text">
        <h4>Lấy UDID thiết bị iOS</h4>
        <p>udid.kieuanhdev.id.vn</p>
      </div>
    </div>

    <div class="sheet-actions">
      <div class="action-row">
        <span>Sao chép liên kết</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </div>

      <!-- Dòng được highlight -->
      <div class="action-row highlighted">
        <div style="display:flex;align-items:center;gap:10px;">
          <strong style="font-size:15px;color:#000;">Thêm vào Màn hình chính</strong>
        </div>
        <div style="display:flex;align-items:center;">
          <span class="action-tag">CHỌN DÒNG NÀY</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.4"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
      </div>

      <div class="action-row">
        <span>Thêm dấu trang</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

// 3. HOME STEP 3: Add to Home Screen confirmation screen with "Thêm" button
const homeStep3Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${iosBaseCss}
.nav-bar {
  height: 48px;
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
  position: relative;
}
.btn-tag {
  position: absolute;
  bottom: -28px;
  right: 0;
  background: #FF3B30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(255,59,48,0.4);
}
.nav-title {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}
.form-area {
  padding: 20px 16px;
}
.app-card {
  background: #FFF;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.app-icon-img {
  width: 56px;
  height: 56px;
  border-radius: 13px;
  background: linear-gradient(135deg, #EA5626, #F27A54);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(234,86,38,0.3);
  color: #fff;
  font-weight: 800;
  font-size: 18px;
}
.app-meta h4 {
  font-size: 16px;
  font-weight: 700;
  color: #000;
}
.app-meta p {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 2px;
}
.hint-text {
  margin: 14px 4px 0;
  font-size: 12.5px;
  color: #6C6C70;
  line-height: 1.4;
}
</style>
</head>
<body>
<div class="iphone-screen">
  <div class="status-bar" style="background:#F2F2F7;color:#000;">
    <span>9:41</span>
    <div class="dynamic-island"></div>
    <div class="status-icons">
      <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
      <svg width="22" height="11" viewBox="0 0 25 12" fill="#000"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#000" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.5"/><path d="M23 4.5v3" stroke="#000" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="nav-bar">
    <div class="nav-btn">Hủy</div>
    <div class="nav-title">Thêm vào MH chính</div>
    <div class="nav-btn bold">
      Thêm
      <span class="btn-tag">BẤM VÀO ĐÂY</span>
    </div>
  </div>

  <div class="form-area">
    <div class="app-card">
      <div class="app-icon-img">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
      </div>
      <div class="app-meta">
        <h4>Lấy UDID</h4>
        <p>udid.kieuanhdev.id.vn</p>
      </div>
    </div>

    <p class="hint-text">Một biểu tượng sẽ được thêm vào Màn hình chính của bạn để bạn có thể truy cập nhanh vào trang web này bất kỳ lúc nào.</p>
  </div>
</div>
</body>
</html>`;

fs.writeFileSync(path.join(tempDir, 'home-step1.html'), homeStep1Html);
fs.writeFileSync(path.join(tempDir, 'home-step2.html'), homeStep2Html);
fs.writeFileSync(path.join(tempDir, 'home-step3.html'), homeStep3Html);

console.log('Home step HTML templates generated in scratch/');
