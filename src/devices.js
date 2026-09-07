/**
 * Bảng tra cứu mã định danh phần cứng của Apple sang tên thương mại chính thức.
 * Nguồn dữ liệu: Apple Support & IPSW Device Database.
 */
const DEVICE_MAP = {
  // iPhone 16 series
  'iPhone17,1': 'iPhone 16 Pro',
  'iPhone17,2': 'iPhone 16 Pro Max',
  'iPhone17,3': 'iPhone 16',
  'iPhone17,4': 'iPhone 16 Plus',

  // iPhone 15 series
  'iPhone16,1': 'iPhone 15 Pro',
  'iPhone16,2': 'iPhone 15 Pro Max',
  'iPhone15,4': 'iPhone 15',
  'iPhone15,5': 'iPhone 15 Plus',

  // iPhone 14 series
  'iPhone15,2': 'iPhone 14 Pro',
  'iPhone15,3': 'iPhone 14 Pro Max',
  'iPhone14,7': 'iPhone 14',
  'iPhone14,8': 'iPhone 14 Plus',

  // iPhone 13 series & SE 3
  'iPhone14,2': 'iPhone 13 Pro',
  'iPhone14,3': 'iPhone 13 Pro Max',
  'iPhone14,4': 'iPhone 13 mini',
  'iPhone14,5': 'iPhone 13',
  'iPhone14,6': 'iPhone SE (thế hệ 3)',

  // iPhone 12 series
  'iPhone13,1': 'iPhone 12 mini',
  'iPhone13,2': 'iPhone 12',
  'iPhone13,3': 'iPhone 12 Pro',
  'iPhone13,4': 'iPhone 12 Pro Max',

  // iPhone 11 series & SE 2
  'iPhone12,1': 'iPhone 11',
  'iPhone12,3': 'iPhone 11 Pro',
  'iPhone12,5': 'iPhone 11 Pro Max',
  'iPhone12,8': 'iPhone SE (thế hệ 2)',

  // iPhone XS / XS Max / XR
  'iPhone11,2': 'iPhone XS',
  'iPhone11,4': 'iPhone XS Max',
  'iPhone11,6': 'iPhone XS Max',
  'iPhone11,8': 'iPhone XR',

  // iPhone X / 8 / 8 Plus
  'iPhone10,1': 'iPhone 8',
  'iPhone10,4': 'iPhone 8',
  'iPhone10,2': 'iPhone 8 Plus',
  'iPhone10,5': 'iPhone 8 Plus',
  'iPhone10,3': 'iPhone X',
  'iPhone10,6': 'iPhone X',

  // iPhone 7 / 7 Plus
  'iPhone9,1': 'iPhone 7',
  'iPhone9,3': 'iPhone 7',
  'iPhone9,2': 'iPhone 7 Plus',
  'iPhone9,4': 'iPhone 7 Plus',

  // iPhone SE 1 / 6s / 6s Plus
  'iPhone8,1': 'iPhone 6s',
  'iPhone8,2': 'iPhone 6s Plus',
  'iPhone8,4': 'iPhone SE (thế hệ 1)',

  // iPhone 6 / 6 Plus / 5s / 5c / 5
  'iPhone7,1': 'iPhone 6 Plus',
  'iPhone7,2': 'iPhone 6',
  'iPhone6,1': 'iPhone 5s',
  'iPhone6,2': 'iPhone 5s',
  'iPhone5,3': 'iPhone 5c',
  'iPhone5,4': 'iPhone 5c',
  'iPhone5,1': 'iPhone 5',
  'iPhone5,2': 'iPhone 5',

  // iPad Pro (M4)
  'iPad16,3': 'iPad Pro 11-inch (M4)',
  'iPad16,4': 'iPad Pro 11-inch (M4)',
  'iPad16,5': 'iPad Pro 13-inch (M4)',
  'iPad16,6': 'iPad Pro 13-inch (M4)',

  // iPad Air (M2)
  'iPad14,8': 'iPad Air 11-inch (M2)',
  'iPad14,9': 'iPad Air 11-inch (M2)',
  'iPad14,10': 'iPad Air 13-inch (M2)',
  'iPad14,11': 'iPad Air 13-inch (M2)',

  // iPad Pro (M2 / M1)
  'iPad14,3': 'iPad Pro 11-inch (thế hệ 4)',
  'iPad14,4': 'iPad Pro 11-inch (thế hệ 4)',
  'iPad14,5': 'iPad Pro 12.9-inch (thế hệ 6)',
  'iPad14,6': 'iPad Pro 12.9-inch (thế hệ 6)',
  'iPad13,4': 'iPad Pro 11-inch (thế hệ 3)',
  'iPad13,5': 'iPad Pro 11-inch (thế hệ 3)',
  'iPad13,6': 'iPad Pro 11-inch (thế hệ 3)',
  'iPad13,7': 'iPad Pro 11-inch (thế hệ 3)',
  'iPad13,8': 'iPad Pro 12.9-inch (thế hệ 5)',
  'iPad13,9': 'iPad Pro 12.9-inch (thế hệ 5)',
  'iPad13,10': 'iPad Pro 12.9-inch (thế hệ 5)',
  'iPad13,11': 'iPad Pro 12.9-inch (thế hệ 5)',

  // iPad Air (thế hệ 5 / 4 / 3)
  'iPad13,16': 'iPad Air (thế hệ 5)',
  'iPad13,17': 'iPad Air (thế hệ 5)',
  'iPad13,1': 'iPad Air (thế hệ 4)',
  'iPad13,2': 'iPad Air (thế hệ 4)',
  'iPad11,3': 'iPad Air (thế hệ 3)',
  'iPad11,4': 'iPad Air (thế hệ 3)',

  // iPad mini (thế hệ 6 / 5)
  'iPad14,1': 'iPad mini (thế hệ 6)',
  'iPad14,2': 'iPad mini (thế hệ 6)',
  'iPad11,1': 'iPad mini (thế hệ 5)',
  'iPad11,2': 'iPad mini (thế hệ 5)',

  // iPad phổ thông
  'iPad13,18': 'iPad (thế hệ 10)',
  'iPad13,19': 'iPad (thế hệ 10)',
  'iPad12,1': 'iPad (thế hệ 9)',
  'iPad12,2': 'iPad (thế hệ 9)',
  'iPad11,6': 'iPad (thế hệ 8)',
  'iPad11,7': 'iPad (thế hệ 8)',
  'iPad7,11': 'iPad (thế hệ 7)',
  'iPad7,12': 'iPad (thế hệ 7)',
};

/**
 * Chuyển mã phần cứng của Apple sang tên thương mại thân thiện.
 * @param {string|null|undefined} productIdentifier - ví dụ "iPhone11,6", "iPhone15,2"
 * @returns {string} - ví dụ "iPhone XS Max", hoặc trả lại mã gốc nếu chưa có trong từ điển
 */
export function getDeviceModelName(productIdentifier) {
  if (!productIdentifier) return 'Thiết bị Apple';
  const cleanId = String(productIdentifier).trim();
  return DEVICE_MAP[cleanId] || cleanId;
}
