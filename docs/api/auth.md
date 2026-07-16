# Xác thực API

> **Trạng thái: hiện thực một phần.** Đã chạy thật: `register`, `login`,
> `logout` (route trong `src/app/api/auth/`, form đã nối API, layout `(app)`
> chặn khi chưa đăng nhập) và **đăng nhập OAuth Google/GitHub** (xem mục
> OAuth). Chưa hiện thực: `/api/me`, `change-password`, `forgot-password`,
> `reset-password`, `sessions` — form quên mật khẩu hiện chỉ là UI.
> Xem [README.md](README.md) cho quy ước chung.

Đăng ký, đăng nhập, đăng xuất và đặt lại mật khẩu. Map tới model `User`,
`Session` và `PasswordResetToken` trong `prisma/schema.prisma`.

## Tổng quan endpoint

| Method   | Path                        | Cần đăng nhập | Mô tả                          |
| -------- | --------------------------- | ------------- | ------------------------------ |
| `POST`   | `/api/auth/register`        | Không         | Tạo tài khoản mới              |
| `POST`   | `/api/auth/login`           | Không         | Đăng nhập, tạo phiên           |
| `POST`   | `/api/auth/logout`          | Có            | Xoá phiên hiện tại             |
| `GET`    | `/api/me`                   | Có            | Thông tin người đang đăng nhập |
| `PATCH`  | `/api/me`                   | Có            | Cập nhật hồ sơ                 |
| `POST`   | `/api/auth/change-password` | Có            | Đổi mật khẩu                   |
| `POST`   | `/api/auth/forgot-password` | Không         | Gửi email đặt lại mật khẩu     |
| `POST`   | `/api/auth/reset-password`  | Không         | Đặt mật khẩu mới bằng token    |
| `GET`    | `/api/auth/sessions`        | Có            | Danh sách phiên đang hoạt động |
| `DELETE` | `/api/auth/sessions/:id`    | Có            | Thu hồi một phiên              |
| `GET`    | `/api/auth/oauth/:provider` | Không         | Bắt đầu đăng nhập OAuth ✅     |
| `GET`    | `/api/auth/oauth/:provider/callback` | Không | Provider gọi về ✅         |

---

## POST /api/auth/register

Tạo tài khoản và đăng nhập luôn.

**Request body**

```json
{
  "name": "Ngô Minh Thuận",
  "email": "thuan@manalife.vn",
  "password": "mat-khau-that-dai"
}
```

**Response 201**

```json
{
  "data": {
    "user": {
      "id": "usr_01",
      "name": "Ngô Minh Thuận",
      "email": "thuan@manalife.vn",
      "avatarUrl": null,
      "createdAt": "2026-07-15T05:00:00.000Z"
    },
    "expiresAt": "2026-08-14T05:00:00.000Z"
  }
}
```

Kèm `Set-Cookie: manalife_session=…` (xem [README.md](README.md#xác-thực)).

Chú ý response **không chứa** `passwordHash`. Đừng bao giờ trả nguyên object
Prisma ra ngoài — hãy chọn trường tường minh bằng `select`.

**Lỗi**

| HTTP | `code`              | Khi nào                                        |
| ---- | ------------------- | ---------------------------------------------- |
| 400  | `VALIDATION_FAILED` | Tên/email/mật khẩu không hợp lệ. Kèm `fields`. |
| 409  | `CONFLICT`          | Email đã được đăng ký.                         |
| 429  | `RATE_LIMITED`      | Quá 5 lần / 15 phút / IP.                      |

---

## POST /api/auth/login

**Request body**

```json
{ "email": "thuan@manalife.vn", "password": "mat-khau-that-dai" }
```

**Response 200** — giống `register`.

**Lỗi**

| HTTP | `code`              | Khi nào                          |
| ---- | ------------------- | -------------------------------- |
| 400  | `VALIDATION_FAILED` | Thiếu email hoặc mật khẩu.       |
| 401  | `UNAUTHENTICATED`   | Sai email **hoặc** sai mật khẩu. |
| 429  | `RATE_LIMITED`      | Quá 5 lần / 15 phút / IP.        |

**Thông báo lỗi phải giống hệt nhau cho cả hai trường hợp** — "Email hoặc mật
khẩu không đúng." Nếu phân biệt "email không tồn tại" và "mật khẩu sai", kẻ tấn
công dò được email nào đã đăng ký trên hệ thống.

Cùng lý do: khi email không tồn tại, vẫn phải chạy một phép so sánh hash giả
trước khi trả lỗi. Nếu không, request với email không tồn tại sẽ trả về nhanh
hơn rõ rệt, và chênh lệch thời gian đó cũng đủ để dò email.

---

## POST /api/auth/logout

Xoá phiên hiện tại khỏi database và xoá cookie.

**Response 204** — không có body.

Dùng `POST` chứ không phải `GET`: request `GET` không được phép thay đổi trạng
thái, vì trình duyệt và công cụ prefetch có thể tự gọi vào link mà người dùng
không hề bấm. Trang `/logout` trong app là màn xác nhận, không tự đăng xuất khi
truy cập.

---

## GET /api/me

**Response 200**

```json
{
  "data": {
    "id": "usr_01",
    "name": "Ngô Minh Thuận",
    "email": "thuan@manalife.vn",
    "avatarUrl": null,
    "createdAt": "2026-07-15T05:00:00.000Z"
  }
}
```

---

## PATCH /api/me

Cập nhật hồ sơ. Chỉ gửi trường muốn đổi.

**Request body**

```json
{ "name": "Ngô Minh Thuận" }
```

**Lỗi**

| HTTP | `code`              | Khi nào                            |
| ---- | ------------------- | ---------------------------------- |
| 400  | `VALIDATION_FAILED` | Tên rỗng hoặc quá ngắn.            |
| 409  | `CONFLICT`          | Email mới đã thuộc tài khoản khác. |

Đổi email **không được có hiệu lực ngay**. Phải gửi thư xác nhận tới địa chỉ
mới và chỉ đổi khi người dùng bấm liên kết. Nếu đổi ngay, một người mượn được
máy đang mở sẵn có thể chiếm tài khoản bằng cách đổi email rồi dùng chức năng
quên mật khẩu.

---

## POST /api/auth/change-password

**Request body**

```json
{ "currentPassword": "mat-khau-cu", "newPassword": "mat-khau-moi-dai-hon" }
```

**Response 204**

**Lỗi**

| HTTP | `code`              | Khi nào                    |
| ---- | ------------------- | -------------------------- |
| 400  | `VALIDATION_FAILED` | Mật khẩu mới dưới 8 ký tự. |
| 401  | `UNAUTHENTICATED`   | `currentPassword` sai.     |

Bắt buộc hỏi lại mật khẩu hiện tại dù người dùng đã đăng nhập — nếu không, ai
mượn được máy đang mở sẵn cũng đổi được mật khẩu.

Đổi mật khẩu xong phải **thu hồi mọi phiên khác** của người dùng đó, chỉ giữ lại
phiên hiện tại. Người ta đổi mật khẩu thường vì nghi ngờ bị lộ — nếu phiên của
kẻ tấn công vẫn sống thì việc đổi trở nên vô nghĩa.

---

## POST /api/auth/forgot-password

**Request body**

```json
{ "email": "thuan@manalife.vn" }
```

**Response 200** — **luôn luôn 200**, kể cả khi email không tồn tại:

```json
{
  "data": { "message": "Nếu email có tài khoản, liên kết đặt lại đã được gửi." }
}
```

Trả 404 khi email không tồn tại là biến endpoint này thành công cụ dò danh sách
người dùng. Giao diện trong `src/components/auth/forgot-password-form.tsx` đã
bám theo nguyên tắc này — thông báo thành công dùng cấu trúc "Nếu … có tài
khoản".

**Lỗi**

| HTTP | `code`              | Khi nào                  |
| ---- | ------------------- | ------------------------ |
| 400  | `VALIDATION_FAILED` | Email sai định dạng.     |
| 429  | `RATE_LIMITED`      | Quá 3 lần / giờ / email. |

---

## POST /api/auth/reset-password

**Request body**

```json
{
  "token": "<token từ link trong email>",
  "newPassword": "mat-khau-moi-dai-hon"
}
```

**Response 204**

**Lỗi**

| HTTP | `code`              | Khi nào                              |
| ---- | ------------------- | ------------------------------------ |
| 400  | `VALIDATION_FAILED` | Mật khẩu mới dưới 8 ký tự.           |
| 401  | `UNAUTHENTICATED`   | Token sai, đã dùng, hoặc đã hết hạn. |

Đặt lại mật khẩu xong phải thu hồi **toàn bộ** phiên của người dùng đó.

---

## GET /api/auth/sessions

Danh sách phiên đang hoạt động, để người dùng thấy mình đang đăng nhập ở đâu.

**Response 200**

```json
{
  "data": [
    {
      "id": "ses_01",
      "userAgent": "Chrome trên Windows",
      "ipAddress": "203.0.113.7",
      "createdAt": "2026-07-15T05:00:00.000Z",
      "expiresAt": "2026-08-14T05:00:00.000Z",
      "current": true
    }
  ]
}
```

Không bao giờ trả `tokenHash` ra ngoài.

---

## DELETE /api/auth/sessions/:id

Thu hồi một phiên. Xoá phiên hiện tại tương đương đăng xuất.

**Response 204**

**Lỗi**

| HTTP | `code`      | Khi nào                                    |
| ---- | ----------- | ------------------------------------------ |
| 404  | `NOT_FOUND` | Phiên không tồn tại hoặc thuộc người khác. |

---

## Đăng nhập OAuth (Google, GitHub) — ĐÃ HIỆN THỰC

`provider` nhận `google` hoặc `github`. Luồng authorization code:

1. `GET /api/auth/oauth/:provider` sinh `state` chống CSRF (với Google kèm
   PKCE S256), lưu vào cookie 10 phút rồi chuyển hướng sang provider.
2. Provider gọi về `/callback?code=…&state=…`. Callback đối chiếu `state`,
   đổi `code` lấy access token và lấy hồ sơ người dùng.
3. Tìm user theo thứ tự: (a) `OAuthAccount` đã liên kết → (b) trùng email
   **đã xác minh** → liên kết thêm provider → (c) tạo user mới với
   `passwordHash = null`.
4. Tạo phiên y hệt đăng nhập thường (cookie `manalife_session`, 30 ngày) và
   chuyển hướng về `/dashboard`.

Mọi nhánh lỗi chuyển hướng về `/login?error=<mã>` với mã: `oauth_denied`
(người dùng huỷ / state không khớp), `oauth_failed` (đổi code hoặc lấy hồ sơ
thất bại), `oauth_no_email` (provider không cung cấp email đã xác minh).

Quy tắc an toàn:

- **Không** dùng email làm khoá liên kết — dùng `providerAccountId`
  (`sub` của Google, `id` số của GitHub). Email bên provider có thể đổi.
- Chỉ tự liên kết vào tài khoản sẵn có khi email **đã được provider xác
  minh** — nếu không, kẻ tấn công tạo tài khoản GitHub với email của nạn
  nhân (chưa xác minh) là chiếm được tài khoản.
- Tài khoản OAuth có `passwordHash = null`: code đăng nhập bằng mật khẩu
  phải coi null là "sai mật khẩu" (vẫn chạy so sánh hash giả), không crash.

Biến môi trường: `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — xem `.env.example`.

## Kiểm tra dữ liệu

Client kiểm tra ở `src/lib/validation.ts` để phản hồi nhanh. **Server phải kiểm
tra lại y hệt** — ai cũng gọi được API bằng `curl`, bỏ qua toàn bộ form.

| Trường     | Quy tắc                                                          |
| ---------- | ---------------------------------------------------------------- |
| `name`     | Không rỗng sau khi trim, tối thiểu 2 ký tự                       |
| `email`    | Đúng định dạng, chuẩn hoá về chữ thường trước khi lưu và so sánh |
| `password` | Tối thiểu 8 ký tự                                                |

Chuẩn hoá email về chữ thường là bắt buộc, không phải tuỳ chọn: nếu không,
`Thuan@manalife.vn` và `thuan@manalife.vn` sẽ tạo ra hai tài khoản khác nhau và ràng
buộc `@unique` không ngăn được.

Không áp quy tắc độ dài khi **đăng nhập** — mật khẩu cũ có thể được tạo dưới
quy tắc khác. Chỉ cần kiểm tra có nhập hay chưa.

## Băm mật khẩu

Dùng **argon2id**. Nếu không có sẵn thì bcrypt với cost ≥ 12.

**Hiện thực hiện tại** (`src/lib/auth/password.ts`): băm mới bằng **bcrypt
cost 12** (lựa chọn của dự án). Hash argon2id tạo ở giai đoạn trước vẫn verify
được — `verifyPassword` nhận diện theo prefix `$argon2` — vì đổi thuật toán
băm không được phép khoá tài khoản đã đăng ký. Khi email không tồn tại hoặc
tài khoản chỉ có OAuth (`passwordHash = null`), login vẫn chạy một phép so
sánh với hash mồi để thời gian phản hồi không tố cáo email nào đã đăng ký.

Tuyệt đối không dùng MD5, SHA-1 hay SHA-256 trần để băm mật khẩu — chúng được
thiết kế để chạy nhanh, đúng thứ mà kẻ tấn công cần khi dò hàng tỉ mật khẩu mỗi
giây. Hàm băm mật khẩu phải cố tình chậm.

Cột lưu là `User.passwordHash`. Không có cột nào lưu mật khẩu thô, ở bất kỳ đâu,
kể cả log.

## Vòng đời phiên

1. Sinh token ngẫu nhiên 32 byte bằng `crypto.randomBytes(32)` — **không dùng
   `Math.random()`**, nó không phải nguồn ngẫu nhiên an toàn và có thể đoán được.
2. Gửi token thô cho client qua cookie.
3. Lưu **SHA-256 của token** vào `Session.tokenHash`.
4. Mỗi request: băm token trong cookie rồi tra `tokenHash`.

Ở đây SHA-256 là đúng, dù mục trên vừa cấm dùng nó cho mật khẩu. Khác biệt nằm ở
entropy: token 32 byte ngẫu nhiên không thể dò bằng vét cạn, nên không cần hàm
băm chậm. Mật khẩu do người đặt thì có entropy thấp và dò được, nên mới cần.

Thời hạn: 30 ngày. Phiên hết hạn phải bị dọn định kỳ — `expiresAt` trong quá khứ
không tự biến bản ghi thành vô hiệu, code kiểm tra phiên phải so sánh tường minh.

## Ghi chú khi hiện thực

1. Viết `requireSession(request)` trong `src/lib/api/` trả về `{ userId }` hoặc
   ném lỗi `401`. Mọi route handler cần đăng nhập đều gọi hàm này ở dòng đầu.
2. Kiểm tra session trong `src/app/(app)/layout.tsx` để chặn ở tầng trang, và
   redirect về `/login` khi chưa đăng nhập. Chỉ chặn ở client là không đủ.
3. Bỏ `setTimeout` giả lập trong `login-form.tsx`, `register-form.tsx`,
   `forgot-password-form.tsx`, `logout-panel.tsx` và thay bằng `fetch` thật.
   Lỗi từ `error.fields` đổ thẳng vào state `errors` — cấu trúc đã khớp sẵn.
4. Ở dev trên `localhost`, bỏ cờ `Secure` của cookie, nếu không trình duyệt sẽ
   từ chối lưu và bạn sẽ mất thời gian tìm nguyên nhân "đăng nhập xong vẫn hỏi
   đăng nhập".
