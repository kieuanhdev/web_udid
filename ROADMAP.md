# Roadmap: Website lấy UDID thiết bị iOS

> Mobile Research — công cụ nội bộ hỗ trợ đăng ký UDID vào Apple Developer Account (Internal Testing / AdHoc)

---

## 0. Tech stack chốt

| Lớp | Lựa chọn | Ghi chú |
|---|---|---|
| Runtime | Node 20+ LTS, ESM | `"type": "module"` |
| Server | `node:http` thuần | Không framework — tránh middleware nuốt raw body |
| Ngôn ngữ | JavaScript | TS optional, không bắt buộc với ~200 dòng |
| Parse PKCS#7 | `node-forge` | Bóc chữ ký lấy plist bên trong |
| Parse plist | `plist` | XML plist → JS object |
| Store | `Map` in-memory + TTL 5 phút | Không cần DB |
| Frontend | HTML/CSS thuần | 2 màn hình, không cần build tool |
| Ký profile | `openssl smime -sign` | Chạy **offline**, không phải runtime |
| Hosting | **VPS + Cloudflare proxy** | Không cold start; Render là phương án dự phòng |
| TLS | Cloudflare Universal SSL | Bắt buộc cert công cộng hợp lệ |
| Process manager | systemd | `Restart=always`, auto-restart khi crash |

**Dependencies: đúng 2 package.**

---

## 1. Kiến thức nền cần nắm trước khi code

Đọc phần này trước, tránh mất thời gian debug những thứ vốn là "by design" của Apple.

### 1.1. Luồng Profile Service hoạt động thế nào

```
[1] Safari  → GET /                        (server sinh token, render trang chủ)
[2] User bấm "Lấy UDID"
    Safari  → GET /enroll?t=TOKEN          (trả .mobileconfig kiểu "Profile Service")
[3] iOS tải profile → User vào Settings cài thủ công
[4] Device daemon → POST /callback         (binary PKCS#7 chứa UDID + Challenge)
[5] Server bóc UDID, lưu vào store theo token
    Server  → 301 Location: /result?t=TOKEN
[6] Safari tự bật lên trang result → hiện UDID + nút Copy
```

Điểm quan trọng: **bước [4] là daemon hệ thống gọi, không phải Safari.**

Kéo theo 3 hệ quả:

1. Không có cookie, không có session → phải dùng field `Challenge` trong profile làm token để map ngược request về đúng phiên browser.
2. Không có UI để "trust" cert → HTTPS **bắt buộc** phải là cert từ CA công cộng. Self-signed = fail im lặng, không có thông báo lỗi gì.
3. Content-Type là `application/pkcs7-signature`, body là **binary DER**, không phải JSON/form.

Profile kiểu `Profile Service` là **tạm thời** — iOS tự gỡ sau khi flow kết thúc, không nằm lại trong máy.

### 1.2. Những giới hạn của iOS phải thiết kế xung quanh

| Giới hạn | Ảnh hưởng | Cách xử lý |
|---|---|---|
| iOS 12.2+: tải profile xong Safari **không** tự mở cửa sổ cài | User bị kẹt, không biết làm gì tiếp | Hướng dẫn từng bước có screenshot ở màn hình chủ |
| Chrome / Firefox / in-app webview **không cài được** profile | Fail hoàn toàn, không có lỗi rõ ràng | Detect User-Agent, chặn sớm + hiện thông báo "mở bằng Safari" |
| Profile không ký → cảnh báo đỏ "Unverified" | Vẫn cài được nhưng user nội bộ sẽ hoảng | Ký bằng cert trả phí (xem Phase 5) |
| Web Clip `FullScreen=true` chạy standalone webview | **Không cài được profile từ đó** | Bắt buộc `FullScreen=false` |
| Simulator không có UDID thật | Không test được flow | Chỉ test trên máy thật |

---

## 2. Phase 1 — Khởi tạo project (~30 phút)

### 2.1. Cấu trúc thư mục

```
ios-udid-web/
├── src/
│   ├── server.js            # http server + routing
│   ├── pkcs7.js             # DER → plist → { udid, product, version, serial }
│   ├── store.js             # Map + TTL + xoá-sau-khi-đọc
│   ├── mobileconfig.js      # sinh Profile Service, chèn Challenge token
│   └── ua.js                # detect Safari trên iOS
├── public/
│   ├── index.html           # trang chủ: nút "Lấy UDID" + hướng dẫn
│   ├── result.html          # hiện UDID + nút Copy
│   ├── style.css
│   └── img/                 # screenshot hướng dẫn
├── certs/
│   └── webclip.signed.mobileconfig   # Web Clip đã ký (commit vào repo)
├── scripts/
│   └── sign.sh              # ký profile, chạy ở máy local
├── .env.example
├── render.yaml
└── package.json
```

### 2.2. `package.json`

```json
{
  "name": "ios-udid-web",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "node-forge": "^1.3.1",
    "plist": "^3.1.0"
  }
}
```

### 2.3. Biến môi trường

```bash
# .env.example
BASE_URL=https://udid.example.com    # bắt buộc HTTPS, dùng để build URL callback
PORT=3000
TOKEN_TTL_MS=300000                  # 5 phút
```

`BASE_URL` phải là domain thật ngay từ đầu — URL callback nằm **trong** profile, không sửa được sau khi user đã tải.

**Checklist Phase 1**
- [ ] `npm init` + cài 2 dependency
- [ ] Dựng cây thư mục
- [ ] `.env.example` + đọc env trong code
- [ ] Init git repo, push lên GitHub

---

## 3. Phase 2 — Server core (~2-3 giờ)

Đây là phần khó nhất. Làm đúng thứ tự dưới đây.

### 3.1. `store.js` — token store

Yêu cầu:
- `create()` → sinh token random (dùng `crypto.randomUUID()` hoặc `randomBytes(16).toString('hex')`)
- `set(token, data)` → lưu kèm timestamp
- `take(token)` → đọc **và xoá** (one-time read)
- Tự dọn entry quá TTL — dùng `setInterval` 60 giây, nhớ `.unref()` để không chặn process exit

Lý do xoá-sau-khi-đọc: UDID + Serial là dữ liệu định danh thiết bị. Không lưu lâu hơn mức cần thiết, không ghi ra DB.

### 3.2. `mobileconfig.js` — sinh Profile Service

Template XML plist:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <dict>
    <key>URL</key>
    <string>{{BASE_URL}}/callback</string>
    <key>DeviceAttributes</key>
    <array>
      <string>UDID</string>
      <string>PRODUCT</string>
      <string>VERSION</string>
      <string>SERIAL</string>
    </array>
    <key>Challenge</key>
    <string>{{TOKEN}}</string>
  </dict>
  <key>PayloadType</key>
  <string>Profile Service</string>
  <key>PayloadIdentifier</key>
  <string>vn.softdreams.udid.enroll</string>
  <key>PayloadUUID</key>
  <string>{{UUID}}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadDisplayName</key>
  <string>Lấy UDID thiết bị</string>
  <key>PayloadOrganization</key>
  <string>Softdreams</string>
  <key>PayloadDescription</key>
  <string>Profile tạm thời để đọc UDID. Tự động gỡ sau khi hoàn tất.</string>
</dict>
</plist>
```

Lưu ý:
- `PayloadUUID` phải **khác nhau mỗi lần** sinh, không hardcode
- `PayloadIdentifier` thì giữ cố định
- `Challenge` = token từ store

### 3.3. `pkcs7.js` — bóc UDID từ binary body

```js
import forge from 'node-forge';
import plist from 'plist';

export function extractAttributes(buffer) {
  const der = forge.util.createBuffer(buffer.toString('binary'));
  const p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(der));
  const xml = p7.rawCapture.content.value[0].value;
  const data = plist.parse(xml);
  return {
    udid:    data.UDID,
    product: data.PRODUCT,
    version: data.VERSION,
    serial:  data.SERIAL,
    token:   data.CHALLENGE,
  };
}
```

**Fallback nếu `node-forge` gây rắc rối:** cắt chuỗi từ `<?xml` đến `</plist>` trong buffer rồi parse trực tiếp. Cách này bỏ qua verify chữ ký — chấp nhận được với tool nội bộ, nhưng nên để làm phương án B chứ đừng làm mặc định.

### 3.4. `server.js` — routing + raw body

```js
import http from 'node:http';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, BASE_URL);

  if (req.method === 'POST' && url.pathname === '/callback') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => handleCallback(Buffer.concat(chunks), res));
    req.on('error', () => res.writeHead(400).end());
    return;
  }
  // ... các GET route
});
```

**Điểm chết người:** không được để bất kỳ thứ gì parse cái body này. Đây chính là lý do dùng `node:http` thuần — không có gì để mà nuốt.

### 3.5. Bảng route

| Method | Path | Việc | Header đặc biệt |
|---|---|---|---|
| GET | `/` | Sinh token, render trang chủ, detect UA | |
| GET | `/enroll?t=` | Trả Profile Service | `Content-Type: application/x-apple-aspen-config` |
| POST | `/callback` | Raw body → bóc UDID → store → redirect | `301` + `Location` |
| GET | `/result?t=` | Đọc store, render UDID | |
| GET | `/webclip` | Web Clip đã ký | `Content-Type: application/x-apple-aspen-config` |
| GET | `/health` | Trả `200` cho Render | |

Content-Type ở `/enroll` sai là iOS không nhận ra profile → nó tải về như file text. Đây là lỗi hay gặp nhất.

**Checklist Phase 2**
- [ ] `store.js` với TTL + one-time read
- [ ] `mobileconfig.js` sinh UUID động
- [ ] `pkcs7.js` parse thành công (test bằng payload mẫu lưu ra file)
- [ ] Raw body handler không qua parser
- [ ] Đủ 6 route, Content-Type đúng
- [ ] Redirect 301 về `/result` kèm token

---

## 4. Phase 3 — Frontend (~2 giờ)

### 4.1. `index.html` — trang chủ

Nội dung cần có:

1. **Cảnh báo trình duyệt** — nếu không phải Safari/iOS: hiện thông báo lớn "Vui lòng mở bằng Safari trên iPhone/iPad", ẩn nút chính
2. **Nút "Lấy UDID"** → link tới `/enroll?t=TOKEN`
3. **Hướng dẫn 4 bước có ảnh** — đây là phần quan trọng nhất về mặt UX:

```
Bước 1: Bấm "Lấy UDID" → chọn "Cho phép" (Allow) khi Safari hỏi
Bước 2: Mở Settings → General → VPN & Device Management
        → mục "Profile Downloaded" ở đầu danh sách
Bước 3: Bấm "Install" (Cài đặt) → nhập passcode → "Install" lần nữa
Bước 4: Safari sẽ tự bật lên và hiện UDID
```

Không có hướng dẫn này thì support sẽ bị hỏi liên tục — iOS 12.2+ không tự mở cửa sổ cài nữa.

4. **Nút "Thêm vào màn hình chính"** → link tới `/webclip`

### 4.2. `result.html` — hiện kết quả

- UDID cỡ chữ lớn, font mono, cho phép select
- Nút **Copy** dùng `navigator.clipboard.writeText()`, có fallback `document.execCommand('copy')` cho iOS cũ
- Hiện thêm Product + iOS Version (hữu ích khi ghi log máy test)
- Trạng thái lỗi: token hết hạn / không tìm thấy → hiện nút "Thử lại"

### 4.3. Web Clip mở bằng Safari

```xml
<key>PayloadType</key><string>com.apple.webClip.managed</string>
<key>URL</key><string>{{BASE_URL}}</string>
<key>Label</key><string>Lấy UDID</string>
<key>FullScreen</key><false/>
<key>IsRemovable</key><true/>
<key>Icon</key><data>{{BASE64_PNG}}</data>
```

- `FullScreen=false` → **mấu chốt**, mở bằng Safari thật. `true` sẽ chạy standalone webview và không cài được profile.
- `IsRemovable=true` → user tự xoá được icon
- `Icon` → PNG 120x120 hoặc 180x180, base64

File này **tĩnh**, không cần token → sinh sẵn 1 lần, ký, commit vào `certs/`.

**Checklist Phase 3**
- [ ] Detect UA + chặn non-Safari
- [ ] Hướng dẫn 4 bước kèm screenshot thật
- [ ] Nút Copy có fallback
- [ ] Xử lý trạng thái token hết hạn
- [ ] Web Clip `FullScreen=false`, có icon

---

## 5. Phase 4 — Ký profile (~1 giờ + thời gian mua cert)

### 5.1. Phân biệt 2 loại cert — chỗ này rất dễ nhầm

| Mục đích | Ai lo | Ghi chú |
|---|---|---|
| HTTPS cho endpoint (để daemon iOS chịu POST) | **Render tự cấp** | Xong, không phải làm gì |
| Ký `.mobileconfig` để iOS hiện "Verified" | **Tự lo** | Cần cert riêng |

Cert TLS của Render không dùng để ký được, vì:
- Không truy cập được private key
- EKU chỉ có `serverAuth`, thiếu `codeSigning`/`emailProtection`

### 5.2. Quy trình ký

```bash
# scripts/sign.sh — CHẠY Ở MÁY LOCAL, không phải trên server
openssl smime -sign \
  -in  webclip.mobileconfig \
  -out webclip.signed.mobileconfig \
  -signer cert.pem \
  -inkey key.pem \
  -certfile chain.pem \
  -outform DER -nodetach
```

**Quan trọng về bảo mật:**
- Private key **không** vào repo, **không** vào env của Render
- Ký ở local → commit file **đã ký** vào `certs/`
- Việc ký không xảy ra lúc runtime nên server không cần key

### 5.3. Cert nào

Cert SSL trả phí loại rẻ nhất (Sectigo / DigiCert) là đủ. Let's Encrypt về lý thuyết được nhưng chain hay bị iOS từ chối cho CMS signing → đừng mạo hiểm.

Không ký vẫn chạy được, chỉ là hiện cảnh báo đỏ. Có thể để Phase này sau cùng nếu muốn có bản chạy trước.

**Checklist Phase 4**
- [ ] Mua cert, có `cert.pem` / `key.pem` / `chain.pem`
- [ ] `sign.sh` chạy được ở local
- [ ] Web Clip đã ký, commit vào repo
- [ ] Key **không** có trong git (thêm vào `.gitignore`)
- [ ] Cài thử trên máy thật → hiện "Verified" xanh

---

## 6. Phase 5 — Deploy VPS + Cloudflare (~1.5 giờ)

Phương án chính: VPS riêng, domain trỏ qua Cloudflare proxy (orange cloud). Không cold start, không cần certbot (CF lo TLS), toàn quyền kiểm soát.

**Cảnh báo trước:** Cloudflare có 4 tính năng **bật mặc định sẽ phá flow này**. Phải sửa trước khi test — không thì debug rất khổ, vì request bị chặn ở tầng CF và server không thấy log gì cả.

### 6.1. Kiến trúc

```
Internet
   |  HTTPS (Universal SSL — cert công cộng, daemon iOS chấp nhận)
Cloudflare proxy      <- 4 setting phải sửa, xem 6.3
   |  HTTPS (Origin CA cert)
VPS: Node process, port 3000
   |
systemd (keep-alive, auto-restart)
```

Không cần Nginx nếu dùng **Cloudflare Tunnel**. Nếu expose port thật thì nên có Nginx đứng trước + firewall chỉ cho IP range của Cloudflare vào.

### 6.2. Chạy service trên VPS

`/etc/systemd/system/udid-web.service`:

```ini
[Unit]
Description=iOS UDID Web
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ios-udid-web
EnvironmentFile=/opt/ios-udid-web/.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now udid-web
sudo systemctl status udid-web
journalctl -u udid-web -f      # xem log realtime khi test
```

`Restart=always` quan trọng: nếu process chết giữa lúc daemon iOS đang POST thì systemd dựng lại trong 5 giây.

### 6.3. Cấu hình Cloudflare — 4 việc bắt buộc

#### (1) Cache — nguy hiểm nhất, làm đầu tiên

Mỗi request `/enroll` trả profile chứa **token riêng của phiên đó**. Nếu CF cache lại:

> User B tải profile → nhận token của user A → UDID của B ghi vào phiên của A → **A thấy UDID của máy B**

Bug này test một máy thì không bao giờ gặp. Phải chặn ở **cả 2 tầng**.

Origin gửi header:

```
Cache-Control: no-store, private
```

Và tạo **Cache Rule** trên dashboard (Caching → Cache Rules):

```
If    URI Path contains "/enroll" or "/callback" or "/result"
Then  Bypass cache
```

Chỉ cho cache `/public/*` (CSS, ảnh hướng dẫn).

#### (2) Bot Fight Mode — chặn đúng cái POST của m

Daemon iOS gửi POST với User-Agent không chuẩn browser → CF nhìn thấy là "bot" → trả challenge page HTML. Daemon không giải được challenge → **request không bao giờ tới server**.

Tạo **WAF Custom Rule** (Security → WAF → Custom rules), đặt ưu tiên cao nhất:

```
If    URI Path equals "/callback" and Request Method equals POST
Then  Skip → Super Bot Fight Mode, Managed Rules, Rate Limiting
```

Hoặc tắt Super Bot Fight Mode cho cả zone (tool nội bộ thì được).

#### (3) Browser Integrity Check — cùng nguyên nhân

BIC kiểm tra UA/header, request "lạ" bị chặn. Daemon iOS lọt đúng diện này.

Security → Settings → tắt **Browser Integrity Check** (hoặc thêm vào rule Skip ở trên).

#### (4) SSL/TLS

- Mode: **Full (Strict)**
- Origin cert: dùng **Cloudflare Origin CA** (free, hạn 15 năm, cấp ở SSL/TLS → Origin Server)
- Min TLS Version: **1.2** — đừng set 1.3, không lợi gì mà thêm rủi ro

Đừng dùng mode **Flexible**: client vẫn thấy HTTPS nên daemon iOS vẫn chấp nhận, nhưng chặng CF ↔ origin đi HTTP không mã hoá.

#### Bảng đối chiếu setting

| Setting | Giá trị | Vì sao |
|---|---|---|
| Cache Rule `/enroll`, `/callback`, `/result` | Bypass | Profile chứa token riêng từng phiên |
| `Cache-Control` từ origin | `no-store, private` | Phòng tầng 2 |
| WAF Skip cho `POST /callback` | Bật | Daemon iOS bị nhận diện là bot |
| Browser Integrity Check | Tắt | Cùng lý do |
| SSL/TLS mode | Full (Strict) | |
| Min TLS Version | 1.2 | |
| Auto Minify / Rocket Loader | Tắt | Bớt biến số khi debug |

### 6.4. DNS & domain

1. A record trỏ về IP của VPS, bật proxy (orange cloud)
2. Hoặc dùng Cloudflare Tunnel: `cloudflared tunnel route dns <tunnel> udid.softdreams.vn`
3. Cập nhật `BASE_URL` trong `.env` cho khớp

**Chốt domain trước khi có user dùng.** URL callback nằm trong file profile — user đã tải rồi thì đổi domain là profile cũ trỏ sai chỗ hết.

### 6.5. In-memory store

- 1 instance → `Map` là đủ, chưa cần Redis
- `systemctl restart` là mất sạch store → **đừng restart lúc đang có người test**
- Nếu sau này chạy nhiều instance sau load balancer thì mới phải chuyển Redis

### 6.6. Ký profile — không liên quan tới cert của Cloudflare

Vẫn phải mua cert riêng (Phase 4). Cả 2 cert của CF đều **không** ký được `.mobileconfig`:

| Cert | Vì sao không được |
|---|---|
| Universal SSL | Không truy cập được private key |
| Origin CA | Không phải public CA, iOS không trust |

### 6.7. Nếu không có VPS — phương án Render

`render.yaml`:

```yaml
services:
  - type: web
    name: ios-udid-web
    runtime: node
    plan: free
    buildCommand: npm ci
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: BASE_URL
        value: https://udid.example.com
      - key: TOKEN_TTL_MS
        value: "300000"
```

Free tier ngủ sau 15 phút, cold start 30–60 giây. Nhưng xét flow thực tế:

```
GET /              <- cold start rơi vào ĐÂY (user đợi ~1 phút ở màn hình đầu)
GET /enroll        <- đã warm
cài profile        <- ~30 giây
POST /callback     <- vẫn warm (cách lần trước < 2 phút)
```

Cold start rơi vào lần GET đầu, **không** rơi vào POST callback — chỗ nguy hiểm nhất thì an toàn. Với tool nội bộ chấp nhận được. Muốn sạch thì paid plan (~$7/tháng).

**Đừng dùng Cloudflare Workers/Pages.** `request.arrayBuffer()` lấy raw body được, nhưng `node-forge` cần Node API nên chạy rất chật vật, mà tự parse PKCS#7 bằng Web Crypto thì không đáng công.

### 6.8. So sánh

| | VPS + CF | Render free |
|---|---|---|
| Cold start | Không | 30–60s ở GET đầu |
| Cấu hình ban đầu | Nhiều hơn (4 setting CF) | Gần như không |
| Kiểm soát | Toàn quyền | Hạn chế |
| Chi phí | Đã có sẵn | $0 → $7 |

**Checklist Phase 5**
- [ ] systemd service chạy, `Restart=always`
- [ ] `/health` trả 200
- [ ] Cache Rule bypass cho `/enroll`, `/callback`, `/result`
- [ ] Origin gửi `Cache-Control: no-store, private`
- [ ] WAF Skip cho `POST /callback`
- [ ] Browser Integrity Check đã tắt
- [ ] SSL mode Full (Strict) + Origin CA cert
- [ ] DNS proxy hoạt động, `BASE_URL` khớp domain thật
- [ ] **Test 2 máy cùng lúc** để bắt bug cache (không bỏ qua bước này)

---

## 7. Phase 6 — Test (~2 giờ)

### 7.1. Ma trận thiết bị

| Thiết bị | iOS | Kết quả |
|---|---|---|
| iPhone | 15.x | |
| iPhone | 16.x | |
| iPhone | 17.x | |
| iPhone | 18.x | |
| iPad | 17+ | |

Test trên **máy thật**. Simulator không có UDID thật, không có flow profile.

### 7.2. Test case

**Luồng chính**
- [ ] Safari iOS → tải profile → cài → nhận đúng UDID
- [ ] UDID so khớp với Finder/iTunes (verify tính đúng đắn)
- [ ] Nút Copy hoạt động, paste ra được
- [ ] Icon Web Clip xuất hiện trên màn hình chính
- [ ] Bấm icon → mở **Safari thật** (không phải webview standalone)

**Trường hợp lỗi**
- [ ] Mở bằng Chrome iOS → hiện cảnh báo, không cho tiếp
- [ ] Mở bằng in-app webview (Zalo/Messenger) → hiện cảnh báo
- [ ] Truy cập `/result` với token hết hạn → thông báo rõ ràng + nút thử lại
- [ ] Truy cập `/result` với token bịa → không crash
- [ ] Bỏ ngang giữa flow rồi làm lại → token mới, chạy bình thường
- [ ] 2 máy làm cùng lúc → không lẫn UDID của nhau
- [ ] Desktop browser → hiện hướng dẫn hợp lý

**Server**
- [ ] POST `/callback` với body rỗng → không crash
- [ ] POST `/callback` với body rác → trả lỗi, không crash
- [ ] `/health` trả 200 khi server warm

### 7.3. Nghiệm thu (theo yêu cầu ban đầu)

- [ ] Safari iPhone/iPad tải + cài profile thành công
- [ ] Website trả về chính xác UDID
- [ ] Có nút Copy tiện lợi
- [ ] Ổn định trên iOS 15+
- [ ] Icon Shortcut trên màn hình chính, luôn mở bằng Safari

---

## 8. Ước lượng thời gian

| Phase | Nội dung | Thời gian |
|---|---|---|
| 1 | Khởi tạo project | 0.5h |
| 2 | Server core | 2–3h |
| 3 | Frontend + hướng dẫn | 2h |
| 4 | Ký profile | 1h (+ chờ mua cert) |
| 5 | Deploy VPS + cấu hình Cloudflare | 1.5h |
| 6 | Test đa thiết bị | 2h |
| | **Tổng** | **~9.5–10.5h** (~1.5 ngày) |

Đường tới bản chạy được nhanh nhất: **Phase 1 → 2 → 3 → 5**. Phase 4 (ký cert) có thể làm sau, chỉ ảnh hưởng cảnh báo "Unverified" chứ không ảnh hưởng chức năng.

---

## 9. Bảo mật & riêng tư

- UDID + Serial là **dữ liệu định danh thiết bị** → không ghi DB, không ghi log ra file
- TTL ngắn (5 phút), xoá ngay sau khi đọc
- Không log full UDID ra console ở production (nếu cần debug thì mask: `abc***xyz`)
- Private key ký profile: chỉ ở máy local, `.gitignore`
- Cân nhắc thêm rate limit đơn giản theo IP nếu deploy public — tool này về bản chất nên để nội bộ hoặc có link khó đoán

---

## 10. Rủi ro đã biết

| Rủi ro | Mức | Xử lý |
|---|---|---|
| User không biết vào Settings để cài | **Cao** | Hướng dẫn có screenshot, đây là nguồn support chính |
| Mở bằng non-Safari browser | **Cao** | Detect UA, chặn sớm |
| Cảnh báo "Unverified" làm user lo | Trung bình | Ký profile (Phase 4) |
| **CF cache profile → lẫn UDID giữa 2 user** | **Cao** | Cache Rule bypass + `no-store`; bắt buộc test 2 máy |
| CF Bot Fight Mode chặn POST callback | **Cao** | WAF Skip rule cho `POST /callback` |
| `node-forge` parse fail | Thấp | Fallback cắt chuỗi XML |
| Deploy làm mất store giữa flow | Thấp | Không deploy lúc đang test |
| iOS version mới đổi behavior | Thấp | Test lại khi có iOS major mới |
