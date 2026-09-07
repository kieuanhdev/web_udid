import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, '..', 'public', 'img');
fs.mkdirSync(imgDir, { recursive: true });

// --- SVG 1: Bước 1 - Cho phép tải Profile trên Safari ---
const step1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <defs>
    <filter id="shadow1" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E5EBF5"/>
      <stop offset="100%" stop-color="#D5DFEE"/>
    </linearGradient>
  </defs>

  <!-- Nền thiết bị -->
  <rect width="400" height="240" rx="16" fill="url(#bgGrad1)"/>

  <!-- Thanh địa chỉ Safari mô phỏng phía trên -->
  <rect x="24" y="16" width="352" height="32" rx="10" fill="#FFFFFF" opacity="0.85"/>
  <circle cx="42" cy="32" r="4" fill="#8E8E93"/>
  <rect x="54" y="27" width="100" height="10" rx="5" fill="#8E8E93" opacity="0.6"/>

  <!-- Lớp phủ mờ nền khi hiện popup -->
  <rect width="400" height="240" rx="16" fill="#000000" opacity="0.25"/>

  <!-- Popup Alert kiểu iOS -->
  <g filter="url(#shadow1)">
    <rect x="65" y="46" width="270" height="152" rx="16" fill="#F8F8F9"/>

    <!-- Tiêu đề & Nội dung -->
    <text x="200" y="78" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#1C1C1E">
      Tải về hồ sơ cấu hình
    </text>
    <text x="200" y="98" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#3A3A3C">
      Trang web này đang cố tải về hồ sơ.
    </text>
    <text x="200" y="114" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#3A3A3C">
      Bạn có muốn cho phép không?
    </text>

    <!-- Đường phân cách nút bấm -->
    <line x1="65" y1="140" x2="335" y2="140" stroke="#D1D1D6" stroke-width="0.75"/>
    <line x1="200" y1="140" x2="200" y2="198" stroke="#D1D1D6" stroke-width="0.75"/>

    <!-- Nút Bỏ qua -->
    <text x="132" y="173" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#007AFF">
      Bỏ qua
    </text>

    <!-- Nút Cho phép (Được highlight viền & màu xanh) -->
    <rect x="204" y="144" width="127" height="50" rx="12" fill="#007AFF" fill-opacity="0.12"/>
    <text x="268" y="173" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#007AFF">
      Cho phép
    </text>

    <!-- Bàn tay/Con trỏ chỉ vào nút Cho phép -->
    <g transform="translate(290, 168)">
      <circle cx="0" cy="0" r="16" fill="#FF9500" fill-opacity="0.25"/>
      <circle cx="0" cy="0" r="8" fill="#FF9500"/>
    </g>
  </g>
</svg>`;

// --- SVG 2: Bước 2 - Mở Cài đặt -> Đã tải về hồ sơ ---
const step2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <defs>
    <filter id="shadow2" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Nền giao diện Cài đặt iOS -->
  <rect width="400" height="240" rx="16" fill="#F2F2F7"/>

  <!-- Thanh tiêu đề Cài đặt -->
  <text x="28" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#000000">
    Cài đặt
  </text>

  <!-- Ô tìm kiếm mô phỏng -->
  <rect x="24" y="56" width="352" height="30" rx="8" fill="#E3E3E8"/>
  <circle cx="40" cy="71" r="5" fill="#8E8E93" opacity="0.6"/>
  <text x="54" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#8E8E93">Tìm kiếm</text>

  <!-- Danh thiếp Apple ID mô phỏng -->
  <g filter="url(#shadow2)">
    <rect x="24" y="96" width="352" height="46" rx="10" fill="#FFFFFF"/>
    <circle cx="48" cy="119" r="14" fill="#D1D1D6"/>
    <text x="70" y="116" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#000000">Tài khoản Apple</text>
    <text x="70" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#8E8E93">iCloud, Phương tiện &amp; Mục mua</text>
  </g>

  <!-- Dòng ĐÃ TẢI VỀ HỒ SƠ (Highlight nổi bật) -->
  <g filter="url(#shadow2)">
    <rect x="24" y="152" width="352" height="58" rx="12" fill="#FFFFFF" stroke="#007AFF" stroke-width="2"/>
    
    <!-- Icon Profile -->
    <rect x="36" y="165" width="32" height="32" rx="8" fill="#007AFF"/>
    <path d="M46 183 C46 178 58 178 58 183 Z" fill="#FFFFFF"/>
    <circle cx="52" cy="174" r="4" fill="#FFFFFF"/>

    <!-- Nhãn chữ -->
    <text x="78" y="177" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#007AFF">
      Đã tải về hồ sơ
    </text>
    <text x="78" y="194" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#636366">
      Lấy UDID thiết bị (Softdreams)
    </text>

    <!-- Badge 1 & Chevron > -->
    <circle cx="340" cy="181" r="9" fill="#FF3B30"/>
    <text x="340" y="185" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="#FFFFFF">1</text>
    <path d="M360 176 L365 181 L360 186" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`;

// --- SVG 3: Bước 3 - Bấm Cài đặt (Install) & nhập Passcode ---
const step3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <defs>
    <filter id="shadow3" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Nền giao diện Cài đặt hồ sơ -->
  <rect width="400" height="240" rx="16" fill="#F2F2F7"/>

  <!-- Hộp giao diện modal cài đặt -->
  <g filter="url(#shadow3)">
    <rect x="20" y="16" width="360" height="208" rx="14" fill="#FFFFFF"/>

    <!-- Header điều hướng -->
    <text x="40" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#007AFF">
      Hủy
    </text>
    <text x="200" y="44" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#000000">
      Cài đặt cấu hình
    </text>

    <!-- Nút Cài đặt góc phải (Được đóng khung nổi bật) -->
    <rect x="300" y="26" width="68" height="28" rx="14" fill="#007AFF"/>
    <text x="334" y="45" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">
      Cài đặt
    </text>

    <line x1="20" y1="62" x2="380" y2="62" stroke="#E5E5EA" stroke-width="1"/>

    <!-- Thông tin Profile -->
    <rect x="36" y="80" width="48" height="48" rx="12" fill="#5856D6"/>
    <!-- Icon Profile Shield -->
    <path d="M60 90 L74 95 L74 107 C74 116 60 122 60 122 C60 122 46 116 46 107 L46 95 Z" fill="#FFFFFF"/>

    <text x="96" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#000000">
      Lấy UDID thiết bị
    </text>
    <text x="96" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#8E8E93">
      Tổ chức: Softdreams
    </text>

    <!-- Khối nhắc Passcode -->
    <rect x="36" y="144" width="328" height="60" rx="10" fill="#F8F8FA" stroke="#E5E5EA"/>
    <circle cx="56" cy="174" r="10" fill="#34C759" fill-opacity="0.15"/>
    <path d="M52 174 L55 177 L60 171" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round"/>
    <text x="74" y="168" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#1C1C1E">
      Nhập mật mã mở khóa máy
    </text>
    <text x="74" y="184" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#8E8E93">
      Bấm "Cài đặt" lần nữa để xác nhận gửi thông tin UDID
    </text>
  </g>
</svg>`;

// --- SVG 4: Bước 4 - Safari tự mở lại & hiện kết quả UDID ---
const step4Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <defs>
    <filter id="shadow4" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.1"/>
    </filter>
  </defs>

  <!-- Nền trình duyệt Safari -->
  <rect width="400" height="240" rx="16" fill="#F2F2F7"/>

  <!-- Card kết quả -->
  <g filter="url(#shadow4)">
    <rect x="24" y="20" width="352" height="200" rx="14" fill="#FFFFFF"/>

    <!-- Huy hiệu thành công -->
    <circle cx="200" cy="50" r="18" fill="#34C759"/>
    <path d="M193 50 L198 55 L208 45" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>

    <text x="200" y="84" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#1C1C1E">
      Đã lấy được UDID!
    </text>

    <!-- Khối mã UDID -->
    <rect x="44" y="98" width="312" height="42" rx="8" fill="#F2F2F7" stroke="#D1D1D6"/>
    <text x="56" y="124" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="600" fill="#000000">
      00008110-001234567890ABC
    </text>

    <!-- Nút Copy -->
    <rect x="268" y="104" width="80" height="30" rx="6" fill="#007AFF"/>
    <text x="308" y="123" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#FFFFFF">
      Sao chép
    </text>

    <!-- Thông tin thiết bị -->
    <rect x="44" y="152" width="312" height="48" rx="8" fill="#FAFAFC"/>
    <text x="60" y="172" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#8E8E93">
      Thiết bị: <tspan font-weight="600" fill="#1C1C1E">iPhone 15 Pro</tspan>
    </text>
    <text x="60" y="188" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#8E8E93">
      Phiên bản: <tspan font-weight="600" fill="#1C1C1E">iOS 18.2</tspan>
    </text>
  </g>
</svg>`;

fs.writeFileSync(path.join(imgDir, 'step1.svg'), step1Svg, 'utf8');
fs.writeFileSync(path.join(imgDir, 'step2.svg'), step2Svg, 'utf8');
fs.writeFileSync(path.join(imgDir, 'step3.svg'), step3Svg, 'utf8');
fs.writeFileSync(path.join(imgDir, 'step4.svg'), step4Svg, 'utf8');

console.log('Đã tạo thành công 4 file hình ảnh minh họa bước cài đặt trong public/img:');
console.log('- step1.svg: Cho phép tải Profile');
console.log('- step2.svg: Cài đặt -> Đã tải về hồ sơ');
console.log('- step3.svg: Cài đặt cấu hình & Passcode');
console.log('- step4.svg: Hoàn tất & Hiện UDID');
