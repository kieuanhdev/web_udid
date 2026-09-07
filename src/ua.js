/**
 * Detect trình duyệt Safari thật trên iOS (iPhone/iPad/iPod).
 *
 * Chặn sớm các trường hợp không cài được profile:
 * - Chrome trên iOS (CriOS)
 * - Firefox trên iOS (FxiOS)
 * - Edge trên iOS (EdgiOS)
 * - Opera trên iOS (OPiOS)
 * - Webview trong app (Zalo, Facebook, Messenger, Instagram, TikTok, Line,...)
 * - Các hệ điều hành khác (Android, Windows, macOS thông thường,...)
 *
 * @param {string} ua - chuỗi User-Agent từ request header
 * @returns {boolean} true nếu là Safari trên iOS
 */
export function isSafariIOS(ua = '') {
  if (!ua || typeof ua !== 'string') return false;

  // Kiểm tra thiết bị iOS (iPhone, iPad, iPod)
  // Lưu ý: iPadOS 13+ có thể gửi UA giống macOS ('Macintosh; Intel Mac OS X')
  // nhưng trên server không có navigator.maxTouchPoints để phân biệt trực tiếp,
  // nên hỗ trợ cả pattern iPad truyền thống và iPhone/iPod.
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  if (!isIOS) return false;

  // Loại trừ các trình duyệt bên thứ ba trên iOS
  const isThirdPartyBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua);
  if (isThirdPartyBrowser) return false;

  // Loại trừ in-app webview phổ biến tại Việt Nam và quốc tế
  const isInAppWebview = /Zalo|FBAN|FBAV|Instagram|Line\/|MicroMessenger|musical_ly|TikTok|Twitter/i.test(ua);
  if (isInAppWebview) return false;

  // Kiểm tra phải là Safari
  const hasSafari = /Safari/i.test(ua);
  const hasAppleWebKit = /AppleWebKit/i.test(ua);

  return hasSafari && hasAppleWebKit;
}
