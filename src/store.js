import { randomBytes } from 'node:crypto';

const TTL_MS = Number(process.env.TOKEN_TTL_MS) || 10 * 60 * 1000; // 10 phút mặc định (tránh user thao tác chậm trong Cài đặt)
const CLEANUP_INTERVAL_MS = 60 * 1000; // quét dọn mỗi 60 giây

// Map<token, { data: object|null, createdAt: number }>
// data = null nghĩa là phiên đã tạo (GET /) nhưng chưa có UDID (chưa POST /callback về)
const store = new Map();

/**
 * Sinh token mới, đăng ký một phiên rỗng.
 * Gọi lúc user vào trang chủ (GET /), TRƯỚC khi có UDID.
 * @returns {string} token
 */
export function createSession() {
  const token = randomBytes(16).toString('hex');
  store.set(token, { data: null, createdAt: Date.now() });
  return token;
}

/**
 * Ghi UDID vào một phiên đã tồn tại.
 * Gọi lúc POST /callback nhận được payload từ daemon iOS.
 * @param {string} token
 * @param {{udid: string, product?: string, version?: string, serial?: string}} data
 * @returns {boolean} true nếu ghi thành công, false nếu token không tồn tại/đã hết hạn
 */
export function saveResult(token, data) {
  const entry = store.get(token);
  if (!entry) return false;

  if (isExpired(entry)) {
    store.delete(token);
    return false;
  }

  entry.data = data;
  // Làm mới thời gian tạo để người dùng có trọn vẹn thời lượng TTL tính từ lúc có kết quả
  entry.createdAt = Date.now();
  return true;
}

/**
 * Đọc kết quả của token.
 * Giữ nguyên dữ liệu trong bộ nhớ trong suốt thời gian sống của token (TTL),
 * KHÔNG xoá ngay lần đọc đầu tiên để tránh xung đột:
 * - Tiến trình ngầm của iOS (profiled / CFNetwork) theo dõi redirect ping trước
 * - Trình duyệt Safari mở sau đó
 * - Người dùng vuốt làm mới trang (refresh)
 *
 * @param {string} token
 * @returns {object|null} data nếu có, null nếu không tìm thấy/hết hạn/chưa có UDID
 */
export function getResult(token) {
  const entry = store.get(token);
  if (!entry) return null;

  if (isExpired(entry)) {
    store.delete(token);
    return null;
  }

  return entry.data; // null nếu daemon chưa POST về kịp
}

// Alias để tương thích ngược
export const takeResult = getResult;

function isExpired(entry) {
  return Date.now() - entry.createdAt > TTL_MS;
}

// Dọn rác định kỳ: các token đã quá hạn TTL sẽ được giải phóng khỏi RAM
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(token);
    }
  }
}, CLEANUP_INTERVAL_MS);

cleanupTimer.unref(); // không giữ process sống chỉ vì cái timer này