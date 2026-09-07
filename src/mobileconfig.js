import { randomUUID } from 'node:crypto';

const PAYLOAD_IDENTIFIER = 'vn.softdreams.udid.enroll';
const ORG_NAME = 'Softdreams';

/**
 * Escape các ký tự đặc biệt trong XML — token/UUID của mình tự sinh nên
 * an toàn, nhưng escape cho chắc, phòng khi sau này baseUrl chứa ký tự lạ.
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sinh Profile Service (.mobileconfig) — profile TẠM THỜI để đọc UDID.
 * iOS tự gỡ sau khi flow hoàn tất.
 *
 * @param {{token: string, baseUrl: string}} params
 * @returns {string} XML plist
 */
export function buildEnrollProfile({ token, baseUrl }) {
  if (!token) throw new Error('buildEnrollProfile: thiếu token');
  if (!baseUrl) throw new Error('buildEnrollProfile: thiếu baseUrl');

  const callbackUrl = `${baseUrl}/callback`;
  const payloadUuid = randomUUID().toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <dict>
    <key>URL</key>
    <string>${escapeXml(callbackUrl)}</string>
    <key>DeviceAttributes</key>
    <array>
      <string>UDID</string>
      <string>PRODUCT</string>
      <string>VERSION</string>
      <string>SERIAL</string>
    </array>
    <key>Challenge</key>
    <string>${escapeXml(token)}</string>
  </dict>
  <key>PayloadType</key>
  <string>Profile Service</string>
  <key>PayloadIdentifier</key>
  <string>${PAYLOAD_IDENTIFIER}</string>
  <key>PayloadUUID</key>
  <string>${payloadUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadDisplayName</key>
  <string>Lấy UDID thiết bị</string>
  <key>PayloadOrganization</key>
  <string>${ORG_NAME}</string>
  <key>PayloadDescription</key>
  <string>Profile tạm thời để đọc UDID thiết bị. Tự động gỡ sau khi hoàn tất.</string>
</dict>
</plist>
`;
}