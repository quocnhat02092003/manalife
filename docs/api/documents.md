# Tài liệu API

> **Trạng thái: ĐÃ HIỆN THỰC** — route handler trong `src/app/api/documents*`,
> helpers trong `src/lib/api/documents.ts`, kho lưu trữ dev trên đĩa cục bộ
> trong `src/lib/storage.ts` (thư mục `storage/`, đã gitignore). Xem
> [README.md](README.md) cho quy ước chung.

Module này quản lý giấy tờ cá nhân: hộ chiếu, hợp đồng, bảo hiểm, sao kê — kèm
ngày hết hạn và cảnh báo trước khi hết hạn. Map tới model `PersonalDocument` và
`DocumentFolder` trong `prisma/schema.prisma`, shape response khớp
`PersonalDocument` và `DocumentFolder` trong `src/types/index.ts`.

Các ví dụ bên dưới lấy từ `src/lib/mock/documents.ts`, neo vào ngày `2026-07-15`
(mock sinh ngày tương đối so với "hôm nay").

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/documents` | Danh sách tài liệu, lọc theo thư mục / loại / tag. |
| POST | `/api/documents` | **Tải file lên.** `multipart/form-data`, không phải JSON. |
| GET | `/api/documents/expiring` | Tài liệu sắp hết hạn hoặc đã quá hạn. |
| GET | `/api/documents/:id` | Chi tiết một tài liệu. |
| PATCH | `/api/documents/:id` | Sửa metadata: tên, thư mục, tag, ngày hết hạn. |
| DELETE | `/api/documents/:id` | Xoá tài liệu và file trong kho lưu trữ. |
| GET | `/api/document-folders` | Danh sách thư mục. |
| POST | `/api/document-folders` | Tạo thư mục. |
| PATCH | `/api/document-folders/:id` | Đổi tên hoặc màu thư mục. |
| DELETE | `/api/document-folders/:id` | Xoá thư mục. **Tài liệu bên trong vẫn còn.** |
| GET | `/api/documents/:id/file` | Tải nội dung file, có kiểm tra quyền sở hữu. |

**Thứ tự route quan trọng:** `/api/documents/expiring` phải không bị
`/api/documents/[id]` nuốt mất. Trong App Router của Next.js, segment tĩnh luôn
thắng segment động, nên đặt file tại `src/app/api/documents/expiring/route.ts`
là đủ — `expiring` sẽ không bao giờ bị hiểu thành `id`. Không cần làm gì thêm,
nhưng biết để không hoảng khi thấy hai route trông như trùng nhau.

## `tags`: mảng ở API, chuỗi JSON ở database

SQLite không có kiểu mảng. Vì vậy `PersonalDocument.tags` trong
`prisma/schema.prisma` là:

```prisma
/// Mảng JSON các tag.
tags String @default("[]")
```

Còn `PersonalDocument.tags` trong `src/types/index.ts` là `string[]`.

**API phải nhận và trả mảng thật.** Client không bao giờ được thấy chuỗi JSON —
`"[\"quan trọng\",\"giấy tờ\"]"` lọt ra response là bug, không phải chi tiết hiện
thực.

Chỗ parse/serialize nằm **ở tầng API, ngay sát Prisma** — không nằm trong
component, không nằm trong hook:

```ts
// Đọc: chuỗi JSON → mảng. Đặt ngay sau khi lấy row ra khỏi Prisma.
function toDocument(row: PrismaDocument): PersonalDocument {
  return { ...row, tags: JSON.parse(row.tags) as string[] };
}

// Ghi: mảng → chuỗi JSON. Đặt ngay trước khi đưa vào Prisma.
function toRow(input: { tags?: string[] }) {
  return { ...input, tags: JSON.stringify(input.tags ?? []) };
}
```

Gom hai hàm này vào một nơi (`src/lib/api/documents.ts`) và bắt **mọi** route
handler đi qua chúng. Nếu để mỗi handler tự `JSON.parse`, sẽ có đúng một handler
quên và trả chuỗi thô ra ngoài.

Vài điểm cần cẩn thận:

- **`JSON.parse` có thể ném lỗi.** Cột là `String` nên database không đảm bảo nội
  dung là JSON hợp lệ — một lần seed sai hoặc sửa tay bằng SQL là đủ. Bọc
  `try/catch` và fallback về `[]`: một tài liệu mất tag còn hơn cả trang trả
  `500`.
- **`JSON.parse` có thể trả về thứ không phải mảng.** `"null"`, `"42"`,
  `"{\"a\":1}"` đều là JSON hợp lệ. Kiểm tra `Array.isArray()` trước khi trả.
- **Validate trước khi serialize.** `tags` phải là mảng chuỗi; mỗi tag 1–50 ký
  tự, trim, bỏ rỗng, khử trùng lặp. Không thì `JSON.stringify` sẽ vui vẻ lưu
  `[{"nested":"object"}]` xuống database.
- **Không lọc tag bằng `LIKE` trên cột `tags`.** `?tag=giấy tờ` dịch thành
  `tags LIKE '%giấy tờ%'` sẽ khớp cả tag `"giấy tờ xe"` và bất kỳ chuỗi nào chứa
  nó. Xem [ghi chú khi hiện thực](#ghi-chú-khi-hiện-thực).

Cùng quy ước này áp dụng cho `Note.tags` và `Capture.tags`.

## GET /api/documents

Danh sách tài liệu của người dùng đang đăng nhập.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `folderId` | chuỗi | không | — | Lọc theo thư mục. `folderId=none` lấy tài liệu chưa xếp thư mục (`folderId IS NULL`). |
| `kind` | chuỗi | không | — | `pdf` \| `image` \| `video` \| `sheet` \| `doc` \| `other`. |
| `tag` | chuỗi | không | — | Khớp **chính xác** một tag, không phải khớp một phần. |
| `q` | chuỗi | không | — | Tìm trong `name`. |
| `sort` | chuỗi | không | `-createdAt` | Cho phép: `createdAt`, `name`, `size`, `expiresAt`. Thêm `-` để giảm dần. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. |

`folderId=none` là chuỗi đặc biệt vì query string không diễn đạt được `null`:
`?folderId=` (rỗng) không phân biệt được với "không gửi tham số". Chọn một token
tường minh thì không có chỗ nào để hiểu nhầm.

**Response 200** — `GET /api/documents?folderId=fol_01`

```json
{
  "data": [
    {
      "id": "doc_01",
      "name": "Hộ chiếu — bản scan",
      "kind": "pdf",
      "size": 3251200,
      "folderId": "fol_01",
      "tags": ["quan trọng", "giấy tờ"],
      "expiresAt": "2026-08-29T09:00:00.000Z",
      "createdAt": "2025-06-10T09:00:00.000Z"
    },
    {
      "id": "doc_02",
      "name": "Căn cước công dân",
      "kind": "image",
      "size": 1884160,
      "folderId": "fol_01",
      "tags": ["quan trọng", "giấy tờ"],
      "expiresAt": "2032-04-14T09:00:00.000Z",
      "createdAt": "2025-06-30T09:00:00.000Z"
    },
    {
      "id": "doc_03",
      "name": "Bằng lái xe B2",
      "kind": "image",
      "size": 1433600,
      "folderId": "fol_01",
      "tags": ["giấy tờ"],
      "expiresAt": "2026-08-02T09:00:00.000Z",
      "createdAt": "2025-09-18T09:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 3, "totalPages": 1 }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `kind` ngoài tập hợp lệ, `sort` ngoài danh sách cho phép, `page`/`perPage` không phải số. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## GET /api/documents/expiring

**Endpoint hữu ích nhất của module.** Trả về tài liệu **đã quá hạn hoặc sắp hết
hạn** trong `withinDays` ngày tới, gần hết hạn nhất lên đầu.

Đây là nguồn dữ liệu cho thẻ cảnh báo ở trang Tài liệu
(`src/components/documents/expiring-soon.tsx`). Nó tồn tại riêng thay vì để client
tải hết rồi tự lọc, vì hai lý do: người dùng có thể có hàng nghìn tài liệu mà chỉ
vài cái sắp hết hạn, và câu hỏi "cái gì sắp hết hạn" đủ quan trọng để có index
riêng phục vụ nó.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `withinDays` | số nguyên | không | `60` | Cửa sổ cảnh báo, tính từ hôm nay. Kẹp ở 1–365. |

Mặc định `60` khớp `EXPIRY_WINDOW_DAYS` trong
`src/components/documents/document-meta.ts`. Hai chỗ này phải bằng nhau — nếu đổi
một bên, đổi cả bên kia.

**Không phân trang.** Danh sách này theo bản chất là ngắn, và một cảnh báo bị đẩy
sang trang 2 là một cảnh báo không ai đọc. Nếu nó dài tới mức cần phân trang thì
vấn đề nằm ở `withinDays` quá lớn, không phải ở phân trang.

**Điều kiện lọc:**

```
expiresAt IS NOT NULL AND expiresAt <= now + withinDays
```

Chú ý **không có cận dưới**. Đây là chủ ý, xem quy tắc 3.

**Response 200** — `GET /api/documents/expiring?withinDays=60` vào ngày
`2026-07-15`

```json
{
  "data": [
    {
      "id": "doc_12",
      "name": "Hợp đồng thuê nhà",
      "kind": "pdf",
      "size": 3670016,
      "folderId": "fol_05",
      "tags": ["nhà cửa", "quan trọng"],
      "expiresAt": "2026-07-24T09:00:00.000Z",
      "createdAt": "2025-07-30T09:00:00.000Z"
    },
    {
      "id": "doc_03",
      "name": "Bằng lái xe B2",
      "kind": "image",
      "size": 1433600,
      "folderId": "fol_01",
      "tags": ["giấy tờ"],
      "expiresAt": "2026-08-02T09:00:00.000Z",
      "createdAt": "2025-09-18T09:00:00.000Z"
    },
    {
      "id": "doc_01",
      "name": "Hộ chiếu — bản scan",
      "kind": "pdf",
      "size": 3251200,
      "folderId": "fol_01",
      "tags": ["quan trọng", "giấy tờ"],
      "expiresAt": "2026-08-29T09:00:00.000Z",
      "createdAt": "2025-06-10T09:00:00.000Z"
    }
  ]
}
```

Ba tài liệu, còn lần lượt 9, 18 và 45 ngày. `doc_11` (thẻ bảo hiểm y tế, còn 75
ngày) và `doc_04` (bảo hiểm nhân thọ, còn 120 ngày) nằm ngoài cửa sổ 60 ngày nên
không xuất hiện.

**Response chỉ có `data`, không có `meta`** — không phân trang thì không có gì để
báo.

**Server không trả `days` hay `level`.** Số ngày còn lại và mức độ gấp
(`danger` / `warning`) do client tự tính bằng `getExpiryInfo()`. Lý do: "còn 9
ngày" phụ thuộc vào **hôm nay của người dùng** theo múi giờ máy họ, không phải
theo đồng hồ UTC của server. Server chỉ trả `expiresAt` — một mốc thời gian tuyệt
đối, không mơ hồ. Ngưỡng `EXPIRY_URGENT_DAYS = 14` cũng là chuyện trình bày, đổi
màu chip là việc của client.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `withinDays` không phải số nguyên. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

`withinDays` ngoài khoảng 1–365 thì **kẹp**, không báo lỗi: `withinDays=0` thành
`1`, `withinDays=99999` thành `365`. Người dùng gõ số lạ vẫn thấy một danh sách
hợp lý.

## POST /api/documents

Tải file lên và tạo bản ghi tài liệu.

> **Đây là ngoại lệ duy nhất so với quy ước JSON ở [README.md](README.md#định-dạng-dữ-liệu).**
> Endpoint này nhận `multipart/form-data`, không nhận `application/json`.

Lý do: file nhị phân không đi qua JSON được. Nhét file vào JSON phải mã hoá
base64, làm phình payload thêm ~33% và bắt server giữ nguyên cả file trong RAM để
giải mã. `multipart/form-data` cho phép stream thẳng phần file xuống kho lưu trữ
mà không cần gom hết vào bộ nhớ.

Response vẫn là JSON như mọi endpoint khác. Chỉ **request** khác.

**Request** — `Content-Type: multipart/form-data`

| Phần | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `file` | file nhị phân | có | — | Nội dung file. Tối đa **25 MB**. |
| `name` | chuỗi | không | tên file gốc | Tên hiển thị, 1–200 ký tự. |
| `folderId` | chuỗi | không | `null` | Phải là thư mục của chính người dùng. |
| `tags` | chuỗi | không | `[]` | **Chuỗi JSON của mảng**, ví dụ `["quan trọng","giấy tờ"]`. Xem ghi chú bên dưới. |
| `expiresAt` | ISO 8601 | không | `null` | Ngày hết hạn. |

**`tags` trong multipart:** form-data chỉ có chuỗi, không có kiểu mảng. Hai cách
gửi đều được, chọn một và ghi rõ trong client:

1. Một phần `tags` chứa chuỗi JSON: `tags=["quan trọng","giấy tờ"]`.
2. Lặp lại phần `tags` nhiều lần: `tags=quan trọng`, `tags=giấy tờ` — đọc bằng
   `formData.getAll("tags")`.

Cách (1) nhất quán hơn với phần còn lại của API và xử lý được tag có dấu phẩy.
Dù chọn cách nào, **response vẫn trả mảng thật** như mọi endpoint khác.

**Các trường server tự quyết, client gửi lên cũng bị bỏ qua:**

| Trường | Server lấy từ đâu |
|---|---|
| `id` | cuid sinh mới. |
| `userId` | Phiên đăng nhập. |
| `size` | **Đếm byte thật của file đã nhận.** Không tin `file.size` do client khai. |
| `kind` | Suy ra từ **MIME type thật**. Xem bảng ánh xạ bên dưới. |
| `storageKey` | Server tự đặt. Xem bên dưới. |
| `createdAt` | `now()`. |

### Giới hạn kích thước: 25 MB

Kiểm tra ở **hai** chỗ, không phải một:

1. **Header `Content-Length`** — từ chối sớm với `413` trước khi đọc byte nào.
2. **Trong lúc đọc stream** — đếm byte thật, vượt ngưỡng thì huỷ ngay.

Chỉ tin `Content-Length` là không đủ: nó do client khai, và client có thể khai
`1000` rồi gửi 10 GB. Không có bước (2) thì đĩa server đầy.

25 MB đủ rộng cho dữ liệu thật của module: file lớn nhất trong mock là `doc_09`
(Portfolio thiết kế) — 18.874.368 byte, khoảng 18 MB. Bản scan hộ chiếu chỉ 3 MB.

Vượt giới hạn → `413` với `code: "PAYLOAD_TOO_LARGE"`. Đây là mã riêng của
endpoint này, không có trong bảng mã lỗi chung ở README.

> **Lưu ý về Route Handler:** Next.js có giới hạn body riêng ở tầng framework và
> nền tảng triển khai (Vercel giới hạn cứng body của serverless function). Nếu
> cần file lớn hơn hoặc muốn tránh giới hạn nền tảng, dùng **presigned URL**: API
> chỉ cấp URL, client tải thẳng lên S3/R2, rồi gọi API lần nữa để tạo bản ghi.
> Kiến trúc đó nằm ngoài phạm vi đặc tả này.

### Kiểm tra MIME type thật, không tin phần mở rộng

**Không bao giờ suy ra `kind` từ đuôi tên file.** `hoso.pdf` có thể là file thực
thi đổi tên. Đuôi file là chuỗi ký tự do người dùng gõ ra, không phải sự thật về
nội dung.

Header `Content-Type` trong phần multipart cũng **không đáng tin** — nó do client
khai và sửa được dễ như đổi tên file.

Cách đúng: **đọc magic bytes** (vài byte đầu file) và so với chữ ký đã biết. Dùng
thư viện như `file-type` thay vì tự viết — danh sách chữ ký dài hơn ta tưởng và
sai một byte là nhận nhầm.

```ts
import { fileTypeFromBuffer } from "file-type";

const detected = await fileTypeFromBuffer(head); // 4100 byte đầu là đủ.
if (!detected || !ALLOWED_MIME.has(detected.mime)) {
  return error(415, "UNSUPPORTED_MEDIA_TYPE");
}
// Dùng detected.mime — KHÔNG dùng file.type do client gửi.
const kind = kindFromMime(detected.mime);
```

**Danh sách trắng, không phải danh sách đen.** Liệt kê MIME được phép; mọi thứ
khác từ chối. Danh sách đen luôn thiếu một thứ gì đó.

Ánh xạ MIME → `kind`:

| `kind` | MIME được phép |
|---|---|
| `pdf` | `application/pdf` |
| `image` | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| `video` | `video/mp4`, `video/webm`, `video/quicktime` |
| `sheet` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`), `application/vnd.ms-excel`, `text/csv` |
| `doc` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`), `application/msword`, `text/plain`, `text/markdown` |
| `other` | Mọi MIME khác **trong danh sách trắng** |

`text/csv`, `text/plain` và `text/markdown` không có magic bytes — `file-type`
không nhận ra chúng. Với nhóm này, kiểm tra nội dung có phải UTF-8 hợp lệ hay
không là mức đảm bảo thực tế cao nhất. Đừng vì thế mà mở cửa cho mọi file không
nhận dạng được: file không rơi vào danh sách trắng và cũng không phải văn bản
UTF-8 hợp lệ → từ chối.

**Ngay cả khi MIME đúng, file vẫn có thể độc hại** — PDF có JavaScript nhúng, SVG
có `<script>`. Vì vậy:

- **Không nhận `image/svg+xml`.** SVG là XML, chạy được script, và trình duyệt
  render nó như tài liệu. Nó không có trong bảng trên và đó là chủ ý.
- Khi trả file về, luôn đặt `Content-Disposition: attachment` và
  `X-Content-Type-Options: nosniff`. Đừng để trình duyệt render file của người
  dùng trong ngữ cảnh domain của mình.

### `storageKey`

Cột `PersonalDocument.storageKey` giữ đường dẫn tới file thật trong kho lưu trữ
(S3, R2, hoặc thư mục trên đĩa ở môi trường dev). Bảng database chỉ giữ metadata;
byte của file nằm ở kho lưu trữ.

**`storageKey` không có trong type `PersonalDocument` → không trả ra response.**
Nó là chi tiết nội bộ. Lộ ra ngoài là cho người ta biết cấu trúc kho lưu trữ và
đoán key của người khác.

Quy ước đặt key — **server sinh, không bao giờ lấy từ tên file client gửi**:

```
documents/<userId>/<documentId>/<random>.<ext>
```

- Có `userId` để phân vùng theo người dùng ngay ở tầng storage.
- Có phần ngẫu nhiên để key không đoán được, kể cả khi ai đó biết `documentId`.
- **Không nhét tên file gốc vào key.** Tên file là dữ liệu do người dùng nhập:
  `../../etc/passwd` là một tên file hợp lệ. Tên hiển thị lưu ở cột `name`, còn
  key là do server đặt — hai thứ hoàn toàn tách rời.

### GET /api/documents/:id/file — tải nội dung file

Kiểm tra quyền sở hữu rồi mới stream; `storageKey` không bao giờ lộ ra ngoài,
client chỉ biết `id`. Response headers:

- `Content-Type` — MIME thật đã đọc từ magic bytes lúc upload (cột nội bộ
  `mimeType`).
- `Content-Disposition: inline` **chỉ** cho `image/*` và `video/*` trong danh
  sách trắng (không có SVG) — để xem trước ảnh/video ngay trong app; hai nhóm
  này trình duyệt render bằng bộ giải mã media thuần, không chạy được script.
  Mọi loại khác dùng `attachment` — PDF có JavaScript nhúng, không để trình
  duyệt render trong ngữ cảnh domain của mình.
- `X-Content-Type-Options: nosniff` — luôn bật.
- `Cache-Control: private, max-age=3600` — nội dung file bất biến nên cache
  riêng tư được.

Lỗi: `401 UNAUTHENTICATED`, `404 NOT_FOUND` (không tồn tại, của người khác,
hoặc file đã mất khỏi kho).

**Response 201**

```json
{
  "data": {
    "id": "doc_15",
    "name": "Giấy đăng ký xe",
    "kind": "pdf",
    "size": 1245184,
    "folderId": "fol_01",
    "tags": ["giấy tờ", "xe"],
    "expiresAt": null,
    "createdAt": "2026-07-15T14:30:00.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu phần `file`, `name` rỗng/quá dài, `tags` không phải JSON của mảng chuỗi, `expiresAt` sai định dạng. Kèm `fields`. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | `folderId` không tồn tại hoặc là thư mục của người khác. |
| 413 | `PAYLOAD_TOO_LARGE` | File vượt 25 MB. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Request không phải `multipart/form-data`, **hoặc** MIME thật của file không nằm trong danh sách trắng. |
| 500 | `INTERNAL_ERROR` | Ghi vào kho lưu trữ thất bại. |

## GET /api/documents/:id

Chi tiết một tài liệu.

**Query params** — không có.

**Response 200**

```json
{
  "data": {
    "id": "doc_04",
    "name": "Hợp đồng bảo hiểm nhân thọ",
    "kind": "pdf",
    "size": 5662310,
    "folderId": "fol_02",
    "tags": ["bảo hiểm", "quan trọng"],
    "expiresAt": "2026-11-12T09:00:00.000Z",
    "createdAt": "2025-12-07T09:00:00.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là tài liệu của người khác. |

## PATCH /api/documents/:id

Sửa **metadata**. Chỉ gửi trường muốn đổi.

Endpoint này nhận `application/json` bình thường — chỉ `POST` mới là multipart.

**Request body** — mọi trường tuỳ chọn.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `name` | chuỗi | 1–200 ký tự. |
| `folderId` | chuỗi \| null | `null` = bỏ khỏi thư mục. Phải là thư mục của chính mình. |
| `tags` | string[] | **Mảng thật**, thay thế toàn bộ tag cũ — không phải thêm vào. |
| `expiresAt` | ISO 8601 \| null | `null` = tài liệu không có hạn. |

**Không sửa được `file`, `size`, `kind`, `storageKey`.** Nội dung file là bất
biến: muốn thay file khác thì tải lên tài liệu mới rồi xoá cái cũ. Cho phép thay
file tại chỗ nghĩa là phải quản lý phiên bản, và `size`/`kind` phải đổi theo — độ
phức tạp đó không đáng cho một app quản lý giấy tờ cá nhân.

**`tags` là thay thế, không phải thêm.** `{ "tags": ["giấy tờ"] }` trên `doc_01`
sẽ **xoá** tag `"quan trọng"`. Client muốn thêm một tag thì phải gửi cả mảng cũ
lẫn tag mới. Đây là ngữ nghĩa `PATCH` chuẩn cho trường mảng: gửi giá trị mới của
trường, không phải delta.

**Response 200** — `PATCH /api/documents/doc_03` với body
`{ "expiresAt": "2031-08-02T09:00:00.000Z" }` (vừa gia hạn bằng lái)

```json
{
  "data": {
    "id": "doc_03",
    "name": "Bằng lái xe B2",
    "kind": "image",
    "size": 1433600,
    "folderId": "fol_01",
    "tags": ["giấy tờ"],
    "expiresAt": "2031-08-02T09:00:00.000Z",
    "createdAt": "2025-09-18T09:00:00.000Z"
  }
}
```

Sau lời gọi này, `doc_03` biến mất khỏi `GET /api/documents/expiring` — đúng như
mong đợi, giấy tờ đã gia hạn thì không cần nhắc nữa.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `tags` không phải mảng chuỗi, `name` rỗng, `expiresAt` sai định dạng, body rỗng. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Tài liệu không tồn tại/của người khác, **hoặc** `folderId` không tồn tại/của người khác. |

## DELETE /api/documents/:id

Xoá vĩnh viễn tài liệu **và file trong kho lưu trữ**. Không có thùng rác, không
hoàn tác được.

**Response 200**

```json
{ "data": { "id": "doc_14", "deleted": true } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là tài liệu của người khác. |

## GET /api/document-folders

Toàn bộ thư mục của người dùng. **Không phân trang** — số thư mục theo bản chất là
nhỏ (mock có 5) và cột trái giao diện cần cả danh sách cùng lúc.

**Response 200**

```json
{
  "data": [
    { "id": "fol_01", "name": "Giấy tờ tuỳ thân", "color": "brand" },
    { "id": "fol_02", "name": "Tài chính", "color": "clay" },
    { "id": "fol_03", "name": "Công việc", "color": "violet" },
    { "id": "fol_04", "name": "Sức khoẻ", "color": "sage" },
    { "id": "fol_05", "name": "Nhà cửa", "color": "sand" }
  ]
}
```

`DocumentFolder` **không có** số lượng tài liệu bên trong — type chỉ có `id`,
`name`, `color`. Client tự đếm từ danh sách tài liệu đã tải. Nếu sau này cần đếm
ở server, đó là thay đổi cả type lẫn API, không phải thêm một trường tiện tay.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/document-folders

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `name` | chuỗi | có | — | 1–100 ký tự, không rỗng sau khi trim. |
| `color` | `EventColor` | không | `"brand"` | `brand` \| `clay` \| `violet` \| `sage` \| `sand`. |

```json
{ "name": "Học tập", "color": "sage" }
```

**Response 201**

```json
{ "data": { "id": "fol_06", "name": "Học tập", "color": "sage" } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `name`, `color` ngoài tập `EventColor`. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

Tên thư mục **không** yêu cầu duy nhất — schema không có `@@unique` nào cho
`DocumentFolder`. Hai thư mục cùng tên "Tài chính" là hợp lệ. Không trả `409`.

## PATCH /api/document-folders/:id

Đổi tên hoặc màu. Mọi trường tuỳ chọn.

**Response 200**

```json
{ "data": { "id": "fol_02", "name": "Tài chính cá nhân", "color": "clay" } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `name` rỗng, `color` ngoài tập cho phép, body rỗng. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là thư mục của người khác. |

## DELETE /api/document-folders/:id

Xoá thư mục. **Tài liệu bên trong không bị xoá.**

Quan hệ trong `prisma/schema.prisma`:

```prisma
folder DocumentFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
```

`onDelete: SetNull` nghĩa là: xoá `fol_01` → `doc_01`, `doc_02`, `doc_03` vẫn còn
nguyên, chỉ `folderId` chuyển thành `null`. Chúng xuất hiện ở
`GET /api/documents?folderId=none` và người dùng xếp lại vào thư mục khác.

**Đây là lựa chọn thiết kế có chủ ý.** Thư mục chỉ là cách sắp xếp; tài liệu mới
là thứ có giá trị. Xếp nhầm hộ chiếu vào một thư mục rồi xoá thư mục đó mà mất
luôn hộ chiếu là mất dữ liệu không phục hồi được — không xứng với thao tác "dọn
dẹp cho gọn" mà người dùng nghĩ mình đang làm.

Xoá thư mục là thao tác **an toàn và hoàn tác được bằng tay**: tạo lại thư mục,
xếp tài liệu vào lại. Vì vậy **không** cần hỏi xác nhận "thư mục này có 3 tài
liệu, bạn chắc chứ?" — không có gì để mất.

Đối chiếu: `Expense.category` dùng `onDelete: Restrict` — chặn hẳn việc xoá danh
mục còn giao dịch, vì một khoản tiền không có danh mục thì mất luôn ý nghĩa. Hai
quan hệ, hai lựa chọn khác nhau, mỗi cái đúng cho ngữ cảnh của nó.

**Response 200**

```json
{ "data": { "id": "fol_05", "deleted": true } }
```

Response **không** báo có bao nhiêu tài liệu bị bỏ khỏi thư mục. Client tải lại
danh sách tài liệu sau khi xoá.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là thư mục của người khác. |

Không có `409`/`422` cho "thư mục còn tài liệu". Đó không phải lỗi.

## Quy tắc nghiệp vụ

1. **`tags` là mảng ở API, chuỗi JSON ở database.** Parse/serialize ở tầng API,
   không để chuỗi thô lọt ra client. Xem
   [mục riêng ở trên](#tags-mảng-ở-api-chuỗi-json-ở-database).
2. **`kind` phải thuộc `DocumentKind`**: `pdf` | `image` | `sheet` | `doc` |
   `other`. Cột là `String` trong SQLite nên database không chặn — server bắt
   buộc kiểm tra. `kind` do **server suy ra từ MIME thật** khi upload, client
   không đặt được, và không sửa được sau đó.
3. **Tài liệu đã quá hạn vẫn phải trả về trong `/api/documents/expiring`.**
   Điều kiện lọc **không có cận dưới**: `expiresAt <= now + withinDays`, hết. Đừng
   thêm `AND expiresAt >= now`.

   Hộ chiếu hết hạn hôm qua là thứ người dùng **cần thấy nhất**, không phải thứ
   nên giấu đi. Ẩn nó vì "đã quá muộn rồi" là failure mode tệ nhất mà module này
   có thể mắc: người dùng mở app, thấy danh sách cảnh báo trống, kết luận mọi thứ
   ổn — trong khi giấy tờ đã hết hạn từ tuần trước và app biết điều đó nhưng
   không nói.

   Client đã xử lý đúng: `getExpiryInfo()` trả `days` âm với nhãn `"Đã hết hạn"`
   và gộp vào nhóm `danger` — comment trong `document-meta.ts` ghi rõ "Quá hạn
   cũng gộp vào nhóm gấp để không bị bỏ sót". API phải khớp với hành vi đó.
4. **`expiresAt = null` nghĩa là không có hạn**, không phải "đã hết hạn". Những
   tài liệu này **không bao giờ** xuất hiện trong `/api/documents/expiring`. Sao
   kê ngân hàng (`doc_05`) và CV (`doc_08`) không hết hạn.
5. **Số ngày còn lại và mức độ gấp do client tính.** Server chỉ trả `expiresAt`.
   Xem giải thích ở `GET /api/documents/expiring`.
6. **`POST /api/documents` là `multipart/form-data`** — ngoại lệ duy nhất so với
   quy ước JSON ở README. Response vẫn là JSON.
7. **Không tin client về `size`, `kind`, hay MIME.** Đếm byte thật, đọc magic
   bytes thật. Đuôi file và `Content-Type` do client khai đều sửa được.
8. **`size` là số nguyên byte.** Xem README. Định dạng lại là việc của client.
9. **Nội dung file là bất biến.** `PATCH` chỉ sửa metadata.
10. **Xoá thư mục không xoá tài liệu** (`onDelete: SetNull`). Xoá tài liệu **có**
    xoá file trong kho lưu trữ.
11. **`storageKey` không bao giờ ra khỏi server.** Không có trong type
    `PersonalDocument`, không có trong response nào.
12. Tài liệu luôn thuộc đúng một người dùng. Không có chia sẻ — `PersonalDocument`
    không có quan hệ nào ngoài `user` và `folder`.

## Ghi chú khi hiện thực

- **Index `@@index([userId, expiresAt])` tồn tại để phục vụ
  `/api/documents/expiring`** — comment trong schema ghi rõ điều đó. Cấu trúc
  giống hệt `@@index([userId, startsAt])` của Lịch và hiệu quả vì cùng lý do: cột
  đầu là điều kiện bằng, cột sau là điều kiện khoảng. Sắp xếp theo `expiresAt`
  cũng miễn phí vì index đã sẵn thứ tự.

  ```ts
  const cutoff = addDays(new Date(), withinDays);
  const docs = await prisma.personalDocument.findMany({
    where: {
      userId: session.userId,
      expiresAt: { not: null, lte: cutoff }, // KHÔNG có gte: new Date()
    },
    orderBy: { expiresAt: "asc" }, // Gần hết hạn nhất lên đầu, kể cả số âm.
  });
  ```

  Trong SQLite, `NULL` không bao giờ thoả `<=`, nên `expiresAt: { lte: cutoff }`
  đã tự loại tài liệu không có hạn. `not: null` viết ra cho rõ ý, không phải để
  sửa lỗi.

- **`orderBy: { expiresAt: "asc" }` đặt tài liệu quá hạn lên đầu** — ngày trong
  quá khứ nhỏ hơn ngày hôm nay. Đó là thứ tự đúng: gấp nhất trước. Khớp với
  `.sort((a, b) => a.expiry.days - b.expiry.days)` ở `expiring-soon.tsx`.

- **Lọc `?tag=` không dùng được index và cần cẩn thận với `LIKE`.** `tags` là một
  chuỗi JSON, nên không có cách nào lọc chính xác bằng SQL thuần trên SQLite.
  `tags LIKE '%giấy tờ%'` sẽ khớp cả `"giấy tờ xe"` — sai.

  Hai cách xử lý:

  1. **Lọc trong bộ nhớ**: `LIKE` để thu hẹp sơ bộ, rồi `JSON.parse` và
     `tags.includes(tag)` để lọc chính xác. Đơn giản, đúng, và với quy mô tài liệu
     cá nhân (mock có 14) thì hoàn toàn ổn. Nhớ phân trang **sau** khi lọc, không
     phải trước — nếu không `meta.total` sẽ sai.
  2. **Tách bảng `DocumentTag`** quan hệ nhiều-nhiều. Đúng về chuẩn hoá, lọc được
     bằng index, nhưng phải đổi schema và đổi cả `Note.tags`, `Capture.tags` cho
     nhất quán. Chỉ làm khi thật sự cần.

  Chọn (1) cho tới khi có lý do rõ ràng để đổi.

- **`folderId=none` phải map thành `folderId: null`**, không phải chuỗi
  `"none"`. Nghe hiển nhiên nhưng rất dễ để lọt vào `where` nguyên văn rồi trả về
  danh sách rỗng mãi mà không hiểu vì sao.

- **Thứ tự thao tác khi upload**: ghi file vào kho lưu trữ **trước**, tạo dòng
  database **sau**. Nếu ngược lại và việc ghi file hỏng, database sẽ có một tài
  liệu trỏ tới file không tồn tại — người dùng thấy nó trong danh sách, bấm tải về
  thì lỗi. Ngược lại, file mồ côi trong storage không ai thấy và dọn được bằng job
  định kỳ. **Sai theo hướng có thể dọn dẹp được.**

- **Thứ tự thao tác khi xoá thì ngược lại**: xoá dòng database **trước**, xoá file
  **sau**. Cùng một logic — sau khi database commit, file mồ côi là rác vô hại;
  nếu xoá file trước rồi database rollback thì bản ghi trỏ vào hư không. Đọc
  `storageKey` ra trước khi xoá dòng, và nếu xoá file thất bại thì ghi log rồi bỏ
  qua: người dùng đã yêu cầu xoá, và lỗi storage không phải lý do để từ chối.

- **`PATCH` với `folderId` phải kiểm tra thư mục đích thuộc về mình** trước khi
  ghi. Bỏ qua bước này thì người dùng gán được tài liệu của mình vào thư mục người
  khác — Prisma chỉ kiểm tra khoá ngoại có tồn tại, không kiểm tra nó thuộc về ai.

  ```ts
  if (input.folderId != null) {
    const folder = await prisma.documentFolder.findFirst({
      where: { id: input.folderId, userId: session.userId },
    });
    if (!folder) return notFound();
  }
  ```

- **Đọc `multipart/form-data` trong Route Handler**: `await request.formData()`
  gom toàn bộ vào bộ nhớ — chấp nhận được ở mức 25 MB, nhưng cần chốt chặn
  `Content-Length` **trước** khi gọi nó, nếu không giới hạn kích thước đến quá
  muộn. Với file lớn hơn, đọc `request.body` dạng stream và đếm byte trong lúc
  chảy.

- **`fileTypeFromBuffer` chỉ cần ~4100 byte đầu.** Không cần nạp cả file vào RAM
  chỉ để biết nó là gì.

- **Lọc theo `userId` từ phiên**, không bao giờ từ query param. Xem
  [README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).

- **Response không trả `updatedAt` và `storageKey`.** Hai cột này có trong Prisma
  model nhưng không có trong type `PersonalDocument`. Nhớ `select` đúng trường —
  `select` tường minh an toàn hơn `include`, vì thêm cột nhạy cảm vào schema sau
  này sẽ không tự động rò ra API.
