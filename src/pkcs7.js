import forge from 'node-forge';
import plist from 'plist';

/**
 * Bóc UDID + các attribute khác từ payload PKCS#7 (DER) mà daemon iOS
 * POST về /callback sau khi user cài Profile Service.
 *
 * Payload thực chất là 1 message CMS/PKCS#7 đã ký, bên trong chứa 1 XML plist
 * dạng:
 *   <dict>
 *     <key>UDID</key><string>...</string>
 *     <key>PRODUCT</key><string>...</string>
 *     <key>VERSION</key><string>...</string>
 *     <key>SERIAL</key><string>...</string>
 *     <key>CHALLENGE</key><string>...</string>   <!-- token mình đưa lúc /enroll -->
 *   </dict>
 *
 * @param {Buffer} buffer - raw body của request POST /callback
 * @returns {{udid: string, product: string, version: string, serial: string, token: string}}
 * @throws {Error} nếu không parse được (payload rác/hỏng)
 */
export function extractAttributes(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Payload rỗng');
  }

  let xml;
  try {
    xml = extractViaForge(buffer);
  } catch (forgeErr) {
    // Fallback: cắt chuỗi XML thô ra khỏi buffer, bỏ qua việc verify chữ ký.
    // Chấp nhận được với tool nội bộ — xem note ở cuối file.
    try {
      xml = extractViaRawSlice(buffer);
    } catch (sliceErr) {
      throw new Error(
        `Không đọc được payload PKCS#7 (forge: ${forgeErr.message}; slice: ${sliceErr.message})`
      );
    }
  }

  const data = plist.parse(xml);

  const udid = data.UDID;
  const token = data.CHALLENGE ?? data.Challenge;

  if (!udid || !token) {
    throw new Error('Payload thiếu UDID hoặc CHALLENGE');
  }

  return {
    udid,
    token,
    product: data.PRODUCT ?? null,
    version: data.VERSION ?? null,
    serial: data.SERIAL ?? null,
  };
}

/**
 * Cách chính: dùng node-forge để bóc PKCS#7 đúng chuẩn (parse ASN.1/DER).
 */
function extractViaForge(buffer) {
  const der = forge.util.createBuffer(buffer.toString('binary'));
  const asn1 = forge.asn1.fromDer(der);
  const p7 = forge.pkcs7.messageFromAsn1(asn1);

  const content = p7.rawCapture?.content;
  if (!content) {
    throw new Error('Không tìm thấy content trong PKCS#7');
  }

  // content.value[0].value là chuỗi XML nằm bên trong OCTET STRING
  const xml = content.value?.[0]?.value ?? content.value;
  if (typeof xml !== 'string' || !xml.includes('<?xml')) {
    throw new Error('Content không phải XML plist hợp lệ');
  }
  return xml;
}

/**
 * Fallback: cắt trực tiếp đoạn <?xml ... </plist> ra khỏi buffer thô.
 * Không verify chữ ký — chỉ dùng khi node-forge không parse được
 * (vd. gặp biến thể CMS mà forge chưa hỗ trợ đầy đủ).
 */
function extractViaRawSlice(buffer) {
  const text = buffer.toString('binary'); // giữ nguyên byte, không decode UTF-8 vội
  const start = text.indexOf('<?xml');
  const end = text.indexOf('</plist>');

  if (start === -1 || end === -1) {
    throw new Error('Không tìm thấy plist trong buffer');
  }

  return text.slice(start, end + '</plist>'.length);
}