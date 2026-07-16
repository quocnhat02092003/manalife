# Second Brain API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module này quản lý mọi thứ người dùng lưu lại — ghi chú, bookmark, video,
podcast, email, tài liệu, hình ảnh — quy về một shape chung là `Capture`, cùng
các liên kết giữa chúng và đồ thị tri thức dựng từ các liên kết đó. Map tới model
`Capture` và `CaptureLink` trong `prisma/schema.prisma`, shape response khớp
`Capture`, `GraphNode`, `GraphEdge`, `KnowledgeGraph` trong `src/types/index.ts`.

`Capture` là **bảng trung tâm** của Luma: mọi loại nội dung đều quy về đây để
tìm kiếm, gắn tag và liên kết với nhau trong cùng một đồ thị.

Các ví dụ bên dưới lấy từ `src/lib/mock/second-brain.ts`, neo vào ngày
`2026-07-15` (mock sinh ngày tương đối so với "hôm nay").

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/captures` | Danh sách capture, lọc theo loại / tag / sao. |
| POST | `/api/captures` | Tạo capture mới. |
| GET | `/api/captures/:id` | Chi tiết một capture. |
| PATCH | `/api/captures/:id` | Sửa một phần capture. |
| DELETE | `/api/captures/:id` | Xoá capture và mọi liên kết của nó. |
| POST | `/api/captures/:id/links` | Tạo liên kết tới một capture khác. |
| DELETE | `/api/captures/:id/links/:toId` | Xoá liên kết. |
| GET | `/api/graph` | Đồ thị tri thức: nodes + edges. |

Capture loại `email` cũng được tạo bởi `POST /api/emails/:id/save-to-brain` —
xem [email.md](email.md#post-apiemailsidsave-to-brain).

## Bảy loại capture

`CaptureType` có đúng bảy giá trị. Không có "khác", không có loại tự định nghĩa.

| `type` | Nhãn UI | `sourceUrl` | `sourceName` | Ví dụ trong mock |
|---|---|---|---|---|
| `note` | Ghi chú | `null` | `null` | `cap_01`, `cap_05` |
| `bookmark` | Bookmark | URL bài viết | Tên trang | `cap_02`, `cap_07`, `cap_11` |
| `video` | Video | URL video | `"YouTube"` | `cap_03`, `cap_10` |
| `podcast` | Podcast | URL tập | `"Spotify"` | `cap_04`, `cap_12` |
| `email` | Email | `null` | Tên người gửi | `cap_08` |
| `document` | Tài liệu | `null` | `null` | `cap_09` |
| `image` | Hình ảnh | `null` | `null` | `cap_06` |

Nhãn tiếng Việt nằm ở `captureTypeLabels` trong `src/lib/mock/second-brain.ts` —
**việc của client**, API luôn trả khoá tiếng Anh (`"note"`, không phải
`"Ghi chú"`).

Cột `type` là `String` trong SQLite → database không chặn giá trị sai. Server bắt
buộc kiểm tra. `type` **không sửa được sau khi tạo** — xem quy tắc 4.

## GET /api/captures

Danh sách capture của người dùng đang đăng nhập, mới nhất lên đầu.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `type` | chuỗi | không | — | Một trong bảy `CaptureType`. Vắng mặt nghĩa là mọi loại. |
| `tag` | chuỗi | không | — | Khớp **chính xác** một tag, không phải khớp một phần. |
| `q` | chuỗi | không | — | Tìm trong `title`, `excerpt` và `tags`. |
| `starred` | boolean | không | — | `true` chỉ lấy capture có sao. Vắng mặt nghĩa là không lọc. |
| `sort` | chuỗi | không | `-createdAt` | Cho phép: `createdAt`, `title`. Thêm `-` để giảm dần. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. |

Bốn bộ lọc kết hợp bằng `AND`, khớp đúng hành vi `CapturesBrowser` hiện tại
(`src/components/second-brain/captures-browser.tsx`).

`q` tìm trong **cả ba** `title`, `excerpt`, `tags` — không chỉ tiêu đề. Đây là
hành vi client đang có, và nó có lý: người dùng nhớ nội dung hoặc chủ đề nhiều
hơn nhớ tiêu đề chính xác. So khớp không phân biệt hoa thường và chuẩn hoá Unicode
NFC (xem `normalize()` trong cùng file).

`tag` và `q` khác nhau: `?tag=thói quen` chỉ lấy capture **có đúng tag đó**, còn
`?q=thói quen` lấy cả capture có cụm đó trong tiêu đề hay trích đoạn.

**Response 200** — `GET /api/captures?type=note`

```json
{
  "data": [
    {
      "id": "cap_01",
      "type": "note",
      "title": "Ý tưởng nội dung: Series \"Productive Week\"",
      "excerpt": "Mỗi thứ Hai đăng một bài ngắn về cách sắp xếp tuần làm việc. Tuần 1: chọn 3 việc quan trọng nhất.",
      "sourceUrl": null,
      "sourceName": null,
      "tags": ["nội dung", "năng suất"],
      "starred": false,
      "createdAt": "2026-07-15T10:15:00.000Z",
      "linkedIds": ["cap_04", "cap_07"]
    },
    {
      "id": "cap_05",
      "type": "note",
      "title": "Atomic Habits — Chương 3: Ba lớp thay đổi",
      "excerpt": "Kết quả → quy trình → bản dạng. Thay đổi bền vững bắt đầu từ câu hỏi mình muốn trở thành ai.",
      "sourceUrl": null,
      "sourceName": null,
      "tags": ["sách", "thói quen"],
      "starred": true,
      "createdAt": "2026-07-14T21:40:00.000Z",
      "linkedIds": ["cap_04", "cap_06"]
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 2, "totalPages": 1 }
}
```

`tags` và `linkedIds` là **mảng thật** trong response, dù database lưu `tags`
dạng chuỗi JSON và `linkedIds` không phải một cột nào cả — xem
[quy tắc 1](#quy-tắc-nghiệp-vụ) và
[ghi chú khi hiện thực](#ghi-chú-khi-hiện-thực).

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `type` ngoài bảy giá trị, `starred` không phải boolean, `sort` ngoài danh sách cho phép. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/captures

Tạo capture mới.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `type` | `CaptureType` | có | — | Một trong bảy giá trị. Không đổi được sau khi tạo. |
| `title` | chuỗi | có | — | 1–300 ký tự, không rỗng sau khi trim. |
| `excerpt` | chuỗi \| null | không | `null` | Tối đa 1000 ký tự. |
| `sourceUrl` | chuỗi \| null | không | `null` | URL hợp lệ, chỉ `http`/`https`. |
| `sourceName` | chuỗi \| null | không | `null` | Tối đa 100 ký tự. |
| `tags` | string[] | không | `[]` | Mảng thật. Mỗi tag 1–50 ký tự. |
| `starred` | boolean | không | `false` | |
| `linkedIds` | — | — | — | **Không nhận.** Liên kết tạo riêng qua `POST /api/captures/:id/links`. |

`id` do server sinh (cuid). `userId` lấy từ phiên. `createdAt` là `now()`.

**`linkedIds` không nhận ở đây** dù nó có trong type `Capture`. Nó là trường
**dẫn xuất**, đọc-chỉ, tính từ bảng `CaptureLink`. Tạo liên kết là thao tác riêng
với ngữ nghĩa riêng (phải ghi hai dòng, phải kiểm tra capture đích tồn tại) —
nhét vào body của `POST` chỉ khiến hai đường ghi cùng một dữ liệu và chắc chắn sẽ
lệch nhau.

```json
{
  "type": "bookmark",
  "title": "Deep Work — tóm tắt chương 1",
  "excerpt": "Sự tập trung sâu là kỹ năng hiếm và có giá trị trong nền kinh tế tri thức.",
  "sourceUrl": "https://example.com/deep-work-ch1",
  "sourceName": "Blog",
  "tags": ["tập trung", "sách"],
  "starred": false
}
```

**Response 201**

```json
{
  "data": {
    "id": "cap_13",
    "type": "bookmark",
    "title": "Deep Work — tóm tắt chương 1",
    "excerpt": "Sự tập trung sâu là kỹ năng hiếm và có giá trị trong nền kinh tế tri thức.",
    "sourceUrl": "https://example.com/deep-work-ch1",
    "sourceName": "Blog",
    "tags": ["tập trung", "sách"],
    "starred": false,
    "createdAt": "2026-07-15T16:20:00.000Z",
    "linkedIds": []
  }
}
```

`linkedIds` luôn là `[]` với capture vừa tạo.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `type`/`title`, `type` ngoài bảy giá trị, `tags` không phải mảng chuỗi, `sourceUrl` không phải URL http/https. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## GET /api/captures/:id

Chi tiết một capture.

**Query params** — không có.

**Response 200**

```json
{
  "data": {
    "id": "cap_09",
    "type": "document",
    "title": "Nghiên cứu: Chi phí của việc chuyển ngữ cảnh",
    "excerpt": "Bản PDF học thuật: mỗi lần chuyển việc tốn trung bình 23 phút để lấy lại trạng thái tập trung.",
    "sourceUrl": null,
    "sourceName": null,
    "tags": ["nghiên cứu", "tập trung"],
    "starred": true,
    "createdAt": "2026-07-07T16:00:00.000Z",
    "linkedIds": ["cap_02", "cap_03"]
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là capture của người khác. |

## PATCH /api/captures/:id

Sửa một phần capture. Chỉ gửi trường muốn đổi.

**Request body** — mọi trường tuỳ chọn: `title`, `excerpt`, `sourceUrl`,
`sourceName`, `tags`, `starred`.

**Không sửa được:**

- **`type`** — xem quy tắc 4.
- **`linkedIds`** — dùng endpoint liên kết.
- `createdAt`, `id`, `userId`.

`tags` là **thay thế toàn bộ**, không phải thêm vào:
`{ "tags": ["sách"] }` trên `cap_05` sẽ xoá tag `"thói quen"`.

```json
{ "starred": true, "tags": ["nội dung", "năng suất", "blog"] }
```

**Response 200**

```json
{
  "data": {
    "id": "cap_01",
    "type": "note",
    "title": "Ý tưởng nội dung: Series \"Productive Week\"",
    "excerpt": "Mỗi thứ Hai đăng một bài ngắn về cách sắp xếp tuần làm việc. Tuần 1: chọn 3 việc quan trọng nhất.",
    "sourceUrl": null,
    "sourceName": null,
    "tags": ["nội dung", "năng suất", "blog"],
    "starred": true,
    "createdAt": "2026-07-15T10:15:00.000Z",
    "linkedIds": ["cap_04", "cap_07"]
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `tags` không phải mảng chuỗi, `title` rỗng, `sourceUrl` không hợp lệ, gửi `type`/`linkedIds`, body rỗng. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là capture của người khác. |

## DELETE /api/captures/:id

Xoá vĩnh viễn capture **và mọi liên kết dính tới nó**, cả hai chiều. Không hoàn
tác được.

Việc dọn liên kết là **tự động** nhờ `onDelete: Cascade` trên **cả hai** quan hệ
của `CaptureLink`:

```prisma
from Capture @relation("CaptureLinkFrom", fields: [fromId], references: [id], onDelete: Cascade)
to   Capture @relation("CaptureLinkTo",   fields: [toId],   references: [id], onDelete: Cascade)
```

Cascade trên `fromId` xoá dòng `X→*`, cascade trên `toId` xoá dòng `*→X`. Cần
**cả hai** — chỉ có một thì sẽ còn lại các dòng trỏ tới một capture không tồn tại,
và `GET /api/graph` sẽ sinh ra cạnh trỏ vào hư không. Schema đã đúng; đừng bỏ
cascade nào khi sửa.

Xoá `cap_05` thì `cap_04` và `cap_06` **vẫn còn**, chỉ mất `cap_05` khỏi
`linkedIds` của chúng.

**Response 200**

```json
{ "data": { "id": "cap_10", "deleted": true } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là capture của người khác. |

## Liên kết: vô hướng nhưng lưu có hướng

**Đây là phần dễ làm sai nhất của module. Đọc hết mục này trước khi viết code.**

Comment trong `prisma/schema.prisma`, model `Capture`:

```prisma
// Liên kết là vô hướng nhưng lưu có hướng: mỗi cạnh sinh ra 2 dòng (A→B và
// B→A) để truy vấn "mọi liên kết của node X" chỉ cần quét một cột.
linksFrom CaptureLink[] @relation("CaptureLinkFrom")
linksTo   CaptureLink[] @relation("CaptureLinkTo")
```

Dịch ra cho rõ:

- **Về nghiệp vụ, liên kết là vô hướng.** "cap_01 liên kết cap_04" và "cap_04
  liên kết cap_01" là **cùng một sự thật**. Không có khái niệm chiều, không có
  "nguồn" và "đích". Trong đồ thị chúng là một cạnh, vẽ một lần.
- **Về lưu trữ, mỗi cạnh là hai dòng.** Một cạnh giữa A và B tồn tại dưới dạng
  `(fromId: A, toId: B)` **và** `(fromId: B, toId: A)`.

### Vì sao hai dòng

Để truy vấn "mọi liên kết của X" chỉ cần quét **một cột**:

```ts
// Lưu 2 dòng — một truy vấn, một index, xong.
const links = await prisma.captureLink.findMany({ where: { fromId: id } });
const linkedIds = links.map((l) => l.toId);
```

Nếu chỉ lưu một dòng mỗi cạnh, mọi truy vấn đều phải hỏi cả hai cột:

```ts
// Lưu 1 dòng — mọi truy vấn đều phải OR, và phải chọn cột đúng cho từng dòng.
const links = await prisma.captureLink.findMany({
  where: { OR: [{ fromId: id }, { toId: id }] },
});
const linkedIds = links.map((l) => (l.fromId === id ? l.toId : l.fromId));
```

Cách thứ hai bắt mọi câu truy vấn phải `OR` hai cột — SQLite thường xử lý bằng
cách quét index hai lần rồi hợp nhất, và cái `l.fromId === id ? ... : ...` kia
phải lặp lại ở mọi chỗ đọc liên kết. Quên một chỗ là mất nửa số cạnh mà không
báo lỗi gì.

Đánh đổi: **gấp đôi số dòng, và trách nhiệm giữ đối xứng chuyển sang tầng API**.
Database không tự biết hai dòng là một cạnh — `@@unique([fromId, toId])` chỉ chặn
trùng lặp **trong cùng một chiều**. `(A,B)` và `(B,A)` là hai khoá khác nhau và
database vui vẻ nhận riêng lẻ từng cái.

### Hệ quả: ghi một dòng là graph khuyết cạnh

Nếu `POST /api/captures/:id/links` chỉ ghi `(A,B)` mà quên `(B,A)`:

- `GET /api/captures/A` → `linkedIds` chứa `B`. Nhìn từ A, mọi thứ bình thường.
- `GET /api/captures/B` → `linkedIds` **không** chứa `A`. Nhìn từ B, cạnh không
  tồn tại.

Đây là loại bug tệ nhất: **không có lỗi nào được ném ra**, chỉ có dữ liệu sai một
cách im lặng. Người dùng liên kết hai ghi chú, mở cái thứ hai lên và không thấy
liên kết đâu. Không có gì trong log.

Trong `GET /api/graph`, tuỳ cách duyệt mà cạnh hiện hoặc không — duyệt từ A thấy
cạnh, duyệt từ B không thấy. Đồ thị trở nên phụ thuộc vào thứ tự duyệt, và đó là
lúc mọi thứ hết giải thích được.

**Dữ liệu mock hiện đang mắc đúng lỗi này** — xem
[ghi chú khi hiện thực](#ghi-chú-khi-hiện-thực).

### Quy tắc bất di bất dịch

1. **Tạo liên kết ghi đúng 2 dòng, trong 1 transaction.**
2. **Xoá liên kết xoá đúng 2 dòng, trong 1 transaction.**
3. **Không có đường nào khác ghi vào `CaptureLink`.** Mọi thao tác đi qua hai
   endpoint dưới đây.

Transaction là bắt buộc, không phải cho đẹp: ghi dòng thứ nhất xong rồi tiến
trình chết trước dòng thứ hai → dữ liệu lệch vĩnh viễn, và không có gì phát hiện
ra. Transaction biến "ghi hai dòng" thành một thao tác nguyên tử: hoặc cả hai,
hoặc không dòng nào.

## POST /api/captures/:id/links

Tạo liên kết vô hướng giữa `:id` và `toId`.

**Request body**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `toId` | chuỗi | có | ID capture cần liên kết tới. Phải tồn tại và thuộc về chính người dùng. |

```json
{ "toId": "cap_04" }
```

**Ghi 2 dòng trong 1 transaction:**

```ts
await prisma.$transaction([
  prisma.captureLink.createMany({
    data: [
      { fromId: id, toId },
      { fromId: toId, toId: id },
    ],
    skipDuplicates: true,
  }),
]);
```

`skipDuplicates: true` làm endpoint **idempotent**: gọi hai lần không lỗi, không
tạo dòng thừa — `@@unique([fromId, toId])` chặn ở tầng database. Gọi lại trả
`200` với capture không đổi.

`skipDuplicates` cũng xử lý luôn trường hợp dữ liệu đang lệch (chỉ có `(A,B)`,
thiếu `(B,A)`): dòng thiếu được tạo, dòng đã có bị bỏ qua, kết quả là cạnh **tự
lành**.

**Kiểm tra trước khi ghi:**

| Điều kiện | Nếu vi phạm |
|---|---|
| `:id` tồn tại và thuộc về người dùng | `404` |
| `toId` tồn tại và thuộc về người dùng | `404` |
| `toId !== id` | `422` |

**Không cho tự liên kết** (`toId === id`): một capture liên kết chính nó không có
nghĩa gì trong đồ thị và tạo ra vòng lặp tự thân mà thuật toán layout phải xử lý
riêng. Trả `422` — dữ liệu đúng định dạng, chỉ sai nghiệp vụ.

**Kiểm tra `toId` thuộc về người dùng là bắt buộc, không phải tuỳ chọn.** Bỏ qua
bước này thì người dùng liên kết được capture của mình vào capture của người
khác. Prisma chỉ kiểm tra khoá ngoại tồn tại, không kiểm tra nó thuộc về ai — và
sau đó `GET /api/graph` sẽ trả về node có `id` của người lạ. Xem
[README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).

**Response 200** — `POST /api/captures/cap_01/links` với body `{ "toId": "cap_04" }`

Trả về **capture nguồn đã cập nhật**, để client không phải gọi thêm `GET`:

```json
{
  "data": {
    "id": "cap_01",
    "type": "note",
    "title": "Ý tưởng nội dung: Series \"Productive Week\"",
    "excerpt": "Mỗi thứ Hai đăng một bài ngắn về cách sắp xếp tuần làm việc. Tuần 1: chọn 3 việc quan trọng nhất.",
    "sourceUrl": null,
    "sourceName": null,
    "tags": ["nội dung", "năng suất"],
    "starred": false,
    "createdAt": "2026-07-15T10:15:00.000Z",
    "linkedIds": ["cap_04", "cap_07"]
  }
}
```

Sau lời gọi này, `GET /api/captures/cap_04` **phải** trả `linkedIds` chứa
`"cap_01"`. Nếu không, dòng thứ hai đã không được ghi — quay lại đọc
[mục liên kết](#liên-kết-vô-hướng-nhưng-lưu-có-hướng).

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `toId`, `toId` không phải chuỗi. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | `:id` hoặc `toId` không tồn tại, hoặc là capture của người khác. |
| 422 | `UNPROCESSABLE` | `toId === :id` — không cho tự liên kết. |

Không có `409`: liên kết đã tồn tại thì trả `200`, không phải lỗi. Người dùng
muốn A liên kết B, và sau lời gọi thì A liên kết B — đúng ý, không có gì để báo.

## DELETE /api/captures/:id/links/:toId

Xoá liên kết vô hướng giữa `:id` và `:toId`.

**Xoá đúng 2 dòng, trong 1 transaction:**

```ts
await prisma.captureLink.deleteMany({
  where: {
    OR: [
      { fromId: id, toId },
      { fromId: toId, toId: id },
    ],
  },
});
```

`deleteMany` với `OR` đã là một câu lệnh nguyên tử, nên ở đây không cần
`$transaction` bọc ngoài. Nhưng **phải có cả hai vế `OR`** — chỉ xoá một chiều
thì cạnh vẫn còn nửa: `GET /api/captures/:id` không thấy nó nữa, nhưng
`GET /api/captures/:toId` thì vẫn thấy, và `GET /api/graph` vẫn vẽ cạnh đó. Người
dùng bấm xoá, thấy liên kết biến mất, rồi mở node kia lên và nó vẫn ở đó.

**Idempotent.** Xoá liên kết không tồn tại → `200`, không phải `404`. `404` dành
cho `:id` hoặc `:toId` không tồn tại — bản thân capture, không phải cạnh giữa
chúng. Kết quả mong muốn ("hai capture này không liên kết nữa") đã đạt được dù nó
vốn đã như vậy từ đầu.

**Response 200** — `DELETE /api/captures/cap_01/links/cap_07`

Trả về capture nguồn đã cập nhật:

```json
{
  "data": {
    "id": "cap_01",
    "type": "note",
    "title": "Ý tưởng nội dung: Series \"Productive Week\"",
    "excerpt": "Mỗi thứ Hai đăng một bài ngắn về cách sắp xếp tuần làm việc. Tuần 1: chọn 3 việc quan trọng nhất.",
    "sourceUrl": null,
    "sourceName": null,
    "tags": ["nội dung", "năng suất"],
    "starred": false,
    "createdAt": "2026-07-15T10:15:00.000Z",
    "linkedIds": ["cap_04"]
  }
}
```

`cap_07` đã rời khỏi `linkedIds` của `cap_01`, và `cap_01` cũng đã rời khỏi
`linkedIds` của `cap_07`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | `:id` hoặc `:toId` không tồn tại, hoặc là capture của người khác. |

## GET /api/graph

Trả về `KnowledgeGraph` — toàn bộ đồ thị tri thức của người dùng, gồm `nodes` và
`edges`. Đây là nguồn dữ liệu cho `GraphView`
(`src/components/second-brain/graph-view.tsx`) ở dashboard và trang Second Brain.

**Query params** — không có. Trả toàn bộ đồ thị. Không phân trang: một nửa đồ thị
không phải một đồ thị nhỏ hơn, nó là một đồ thị sai.

**Response 200**

Dưới đây là `knowledgeGraph` hiện tại trong `src/lib/mock/second-brain.ts`:

```json
{
  "data": {
    "nodes": [
      { "id": "n_morning", "label": "Thói quen buổi sáng", "x": 15, "y": 34, "starred": false, "color": "brand", "variant": "secondary" },
      { "id": "n_health", "label": "Sức khoẻ", "x": 15, "y": 72, "starred": false, "color": "brand", "variant": "secondary" },
      { "id": "d_1", "label": "", "x": 30, "y": 42, "starred": false, "color": "brand", "variant": "dot" },
      { "id": "d_2", "label": "", "x": 30, "y": 66, "starred": false, "color": "brand", "variant": "dot" },
      { "id": "n_core", "label": "Lối sống hiệu suất", "x": 50, "y": 52, "starred": true, "color": "brand", "variant": "primary" },
      { "id": "n_time", "label": "Quản lý thời gian", "x": 72, "y": 22, "starred": false, "color": "sage", "variant": "secondary" },
      { "id": "n_focus", "label": "Tập trung sâu", "x": 72, "y": 80, "starred": false, "color": "sage", "variant": "secondary" },
      { "id": "n_side", "label": "Dự án Side Project", "x": 87, "y": 10, "starred": false, "color": "violet", "variant": "secondary" },
      { "id": "n_learn", "label": "Học hỏi liên tục", "x": 87, "y": 92, "starred": false, "color": "sand", "variant": "secondary" }
    ],
    "edges": [
      { "from": "n_morning", "to": "d_1", "strength": "strong" },
      { "from": "d_1", "to": "n_core", "strength": "strong" },
      { "from": "n_health", "to": "d_2", "strength": "strong" },
      { "from": "d_2", "to": "n_core", "strength": "strong" },
      { "from": "n_core", "to": "n_time", "strength": "strong" },
      { "from": "n_core", "to": "n_focus", "strength": "strong" },
      { "from": "n_time", "to": "n_side", "strength": "weak" },
      { "from": "n_focus", "to": "n_learn", "strength": "weak" },
      { "from": "n_side", "to": "n_learn", "strength": "weak" }
    ]
  }
}
```

> **Đây là dữ liệu mock, không phải hình dạng cuối cùng của response.** Đồ thị
> trên được vẽ tay để tái hiện ảnh mẫu: `id` của nó (`n_core`, `d_1`) **không
> tương ứng với capture nào** — không có `cap_xx` nào trong đó. Khi có API thật,
> node phải sinh từ `Capture` và cạnh sinh từ `CaptureLink`. Ba khoảng trống cần
> xử lý trước khi làm được điều đó — xem [Từ mock tới API thật](#từ-mock-tới-api-thật).

**`edges` đã khử trùng lặp: mỗi cạnh đúng một lần.** Database có hai dòng
`CaptureLink` cho mỗi cạnh, nhưng response chỉ chứa một. Không khử thì `GraphView`
vẽ mỗi đường hai lần chồng lên nhau — nhìn không khác gì, nhưng gấp đôi số phần
tử SVG, và nét đứt của cạnh `weak` sẽ chồng lệch pha thành nét liền. Xem
[ghi chú khi hiện thực](#ghi-chú-khi-hiện-thực) cho cách khử.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## Graph layout

**Toạ độ `x`/`y` hiện đang hard-code trong mock. Khi có API, server không nên trả
chúng.**

### Hiện tại

`GraphNode` trong `src/types/index.ts` có `x` và `y`, hệ toạ độ tương đối 0–100,
quy ra `%` trong SVG `viewBox="0 0 100 100"`. Giá trị được đặt tay trong
`src/lib/mock/second-brain.ts` để tái hiện bố cục ảnh mẫu — comment trong file đó
trỏ thẳng tới mục này.

`GraphView` dùng chúng trực tiếp: cạnh vẽ bằng `<line>` trong SVG với
`x1/y1/x2/y2` lấy thẳng từ `node.x`/`node.y`; node vẽ bằng `<span>` HTML định vị
tuyệt đối `left: ${node.x}%; top: ${node.y}%` kèm `-translate-x-1/2
-translate-y-1/2` để căn giữa quanh điểm đó.

**Ràng buộc hiện tại: `x` phải nằm trong khoảng ~14–86.**

Vì node được **căn giữa** quanh `(x, y)` (`-translate-x-1/2`), một nửa chiều rộng
của nó tràn sang mỗi bên. Node có nhãn dài như `"Dự án Side Project"` ở `x: 87`
đã sát mép phải; đẩy thêm nữa là chữ tràn ra ngoài khung. Tương tự với `x: 15` ở
mép trái. Node không bị `overflow` cắt — nó chỉ đơn giản là vẽ đè ra ngoài, trông
như lỗi.

Giới hạn này **không áp dụng cho `y`**: `n_side` ở `y: 10` và `n_learn` ở `y: 92`
đều ổn, vì node thấp hơn nhiều so với chiều rộng của nó.

Đây là ràng buộc **của layout hard-code**, không phải của dữ liệu. Nó tồn tại vì
người viết mock phải tự tránh tràn khung. Thuật toán layout ở client sẽ tự lo
phần này bằng cách tính từ kích thước thật của node — xem bên dưới.

### Khi có API: client tính toạ độ

**Server trả `nodes` + `edges`. Client chạy thuật toán force-directed để tính
`x`/`y`.**

Force-directed layout mô phỏng đồ thị như một hệ vật lý: cạnh là lò xo kéo hai
node lại gần, node là điện tích cùng dấu đẩy nhau ra xa, chạy vài trăm vòng lặp
cho tới khi hệ ổn định. Kết quả là node liên kết chặt thì tụ lại, node rời rạc
thì tách ra — đúng thứ người ta muốn nhìn thấy ở đồ thị tri thức. Thư viện sẵn
có: `d3-force`.

**Vì sao không tính ở server — ba lý do, theo thứ tự quan trọng:**

1. **Toạ độ là chuyện trình bày, không phải dữ liệu.** `x: 50, y: 52` không nói
   gì về tri thức của người dùng. Nó nói về một khung vẽ cụ thể. Sự thật mà server
   nắm giữ là "cap_01 liên kết cap_04" — vẽ nó ở đâu là câu hỏi của tầng hiển
   thị. Trộn hai thứ vào một response là để tầng hiển thị rò rỉ ngược vào tầng dữ
   liệu.

2. **Toạ độ phụ thuộc kích thước khung.** Bố cục đẹp trên màn hình rộng 1200px sẽ
   chen chúc trên khung 360px của điện thoại. Server không biết khung của client
   rộng bao nhiêu, và **không nên biết** — gửi kích thước viewport lên API là một
   dấu hiệu rõ ràng rằng ranh giới đã bị đặt sai chỗ.

3. **Đổi kích thước cửa sổ sẽ phải gọi lại API.** Đây là hệ quả thực tế của (2) và
   là lý do khó chối nhất. Kéo cạnh cửa sổ trình duyệt → mỗi bước kéo là một
   request tính lại layout. Xoay điện thoại từ dọc sang ngang → gọi API. Mở
   sidebar → gọi API. Trong khi nếu tính ở client, đó chỉ là một `ResizeObserver`
   và vài chục mili-giây CPU, không có mạng, không có server, không có trạng thái
   loading.

   Thêm nữa: layout ở client mở đường cho tương tác mà layout ở server không bao
   giờ làm được — kéo thả node, zoom, ghim vị trí, animation khi thêm node mới.
   Những thứ đó đòi mô phỏng phải **sống** ở client.

**Khi chuyển, `GraphNode.x`/`y` sẽ thành optional hoặc bỏ hẳn khỏi response API:**

```ts
/** Node đã tính sẵn toạ độ để vẽ graph. */
export interface GraphNode {
  id: string;
  label: string;
  /**
   * Toạ độ tương đối 0–100, quy ra % trong SVG viewBox.
   * API KHÔNG trả hai trường này — client tự tính bằng force-directed layout.
   * Chúng được điền vào sau khi mô phỏng chạy xong.
   */
  x?: number;
  y?: number;
  starred: boolean;
  color: EventColor;
  variant: "primary" | "secondary" | "dot";
}
```

Chọn `optional` thay vì bỏ hẳn để `GraphView` không phải đổi kiểu dữ liệu đầu
vào: nó vẫn nhận `KnowledgeGraph`, chỉ khác là toạ độ được điền bởi hook layout ở
client thay vì đến từ mock. Đường di chuyển gọn nhất:

1. Thêm `useForceLayout(graph, { width, height })` — nhận `nodes` + `edges`, trả
   `nodes` đã có `x`/`y`, chạy lại khi kích thước đổi.
2. Trang Second Brain gọi `GET /api/graph`, đưa kết quả qua hook, rồi truyền
   xuống `GraphView`.
3. `GraphView` **không đổi gì** — nó vẫn nhận node đã có toạ độ.
4. Bỏ `x`/`y` khỏi mock, hoặc bỏ luôn mock nếu không còn ai import.

Sau bước (1), **ràng buộc `x` trong 14–86 biến mất**: hook đo chiều rộng thật của
node và kẹp tâm node vào trong khung theo đúng nửa chiều rộng đó. Đó là việc mà
người viết mock đang phải làm bằng mắt.

**Lưu ý về `variant: "dot"`:** node `d_1`, `d_2` trong mock là **chấm trang trí**
trên cạnh, không phải capture. Force-directed layout sinh từ `Capture` +
`CaptureLink` sẽ **không sinh ra chúng** — không có gì trong database tương ứng.
Xem bên dưới.

## Từ mock tới API thật

Đồ thị mock là hình vẽ minh hoạ, không phải kết quả của một truy vấn. Ba khoảng
trống giữa nó và một `GET /api/graph` thật, phải quyết trước khi hiện thực:

**1. `GraphEdge.strength` không có cột nào trong `CaptureLink`.**

`CaptureLink` chỉ có `id`, `fromId`, `toId`, `createdAt`. Không có gì để phân biệt
cạnh `strong` (nét liền) với `weak` (nét đứt) — trong mock, `strength` do người
vẽ đặt tay. Ba lựa chọn:

1. **Trả `"strong"` cho mọi cạnh.** Đơn giản, đúng với dữ liệu đang có. `GraphView`
   chạy được ngay. Mất khả năng phân biệt nét đứt/nét liền cho tới khi có (2)
   hoặc (3).
2. **Thêm cột `strength String @default("strong")` vào `CaptureLink`.** Người dùng
   tự chọn khi tạo liên kết. Nhớ: cột này phải giữ **giống nhau ở cả hai dòng**
   của một cạnh — thêm một bất biến nữa cho tầng API phải canh, và một chỗ nữa để
   lệch.
3. **Suy ra.** Ví dụ: `weak` cho cạnh do hệ thống gợi ý, `strong` cho cạnh người
   dùng tự tạo. Cần một cột phân biệt nguồn gốc, tức là vẫn phải đổi schema.

Chọn (1) cho lần hiện thực đầu. Nó không chặn đường tới (2).

**2. `GraphNode.color` không có cột nào trong `Capture`.**

`Capture` không có trường `color` — khác `Note`, `Task`, `CalendarEvent` đều có.
Màu trong mock do người vẽ đặt. Cách tự nhiên nhất: **suy từ `type`**, mỗi loại
capture một màu, bảng tra đặt ở client cạnh `captureMeta`
(`src/components/second-brain/capture-meta.ts`) — chỗ đã giữ icon cho từng loại.
Màu là chuyện trình bày, cùng lý do với `x`/`y`. Nếu server vẫn phải trả `color`
cho khớp type, dùng `"brand"` làm mặc định và để client đè lên.

**3. `variant: "dot"` không có gì tương ứng.**

`d_1`, `d_2` là chấm trang trí giữa cạnh, thuần tuý thẩm mỹ. Không có capture nào
đứng sau chúng. Đồ thị sinh từ database sẽ chỉ có `primary` và `secondary`.

Quy ước hợp lý: `primary` cho node `starred`, `secondary` cho phần còn lại — khớp
với mock, nơi `n_core` là node duy nhất vừa `starred: true` vừa `variant:
"primary"`. Giữ `"dot"` trong type để client tự chèn chấm trang trí nếu muốn, hoặc
bỏ khi dọn dẹp.

Tóm lại, `GET /api/graph` đầu tiên nên trả:

```ts
{
  nodes: captures.map((c) => ({
    id: c.id,                                    // cap_01, không phải n_core
    label: c.title,
    starred: c.starred,
    color: "brand",                              // Client suy từ type.
    variant: c.starred ? "primary" : "secondary",
    // Không có x, y — client tự tính.
  })),
  edges: dedupe(links).map(({ fromId, toId }) => ({
    from: fromId,
    to: toId,
    strength: "strong",                          // Chưa có cột nào để suy.
  })),
}
```

## Quy tắc nghiệp vụ

1. **`tags` là mảng ở API, chuỗi JSON ở database.** Parse/serialize ở tầng API.
   Cùng quy ước với `Note.tags` và `PersonalDocument.tags` — xem
   [documents.md](documents.md#tags-mảng-ở-api-chuỗi-json-ở-database).
2. **`linkedIds` là trường dẫn xuất, đọc-chỉ.** Nó không phải một cột; nó được
   tính từ `CaptureLink`. `POST`/`PATCH` không nhận nó.
3. **`type` phải thuộc bảy giá trị** `CaptureType`: `note` | `bookmark` | `video`
   | `podcast` | `email` | `document` | `image`. Cột là `String` trong SQLite nên
   database không chặn — server bắt buộc kiểm tra.
4. **`type` không đổi được sau khi tạo.** Biến một `bookmark` thành `podcast` là
   vô nghĩa: `sourceUrl` trỏ tới bài viết, `sourceName` là tên blog, và mọi thứ
   trong capture đều là giả định của loại cũ. Muốn đổi thì xoá và tạo lại. Gửi
   `type` trong `PATCH` → `400`.
5. **Liên kết là vô hướng nhưng lưu 2 dòng.** Tạo ghi 2 dòng trong 1 transaction,
   xoá xoá cả 2. Không có ngoại lệ. Xem
   [mục riêng](#liên-kết-vô-hướng-nhưng-lưu-có-hướng) — đây là quy tắc quan trọng
   nhất của module.
6. **Không cho tự liên kết** (`toId === id`) → `422`.
7. **`toId` phải thuộc về chính người dùng.** Kiểm tra trước khi ghi, nếu không
   sẽ liên kết xuyên tài khoản.
8. **Tạo và xoá liên kết đều idempotent.** Gọi lại không lỗi, không trùng.
9. **`edges` trong `GET /api/graph` đã khử trùng lặp** — mỗi cạnh đúng một lần,
   dù database có hai dòng.
10. **`GET /api/graph` không trả `x`/`y`.** Toạ độ do client tính. Xem
    [Graph layout](#graph-layout).
11. **Xoá capture xoá mọi liên kết của nó**, cả hai chiều, tự động qua
    `onDelete: Cascade`. Capture ở đầu kia không bị xoá.
12. Capture luôn thuộc đúng một người dùng. Không có chia sẻ, không có đồ thị
    chung — `Capture` không có quan hệ nào ngoài `user` và hai quan hệ liên kết.

## Ghi chú khi hiện thực

- **Dữ liệu mock đang có 3 liên kết lệch chiều.** Đối chiếu `linkedIds` trong
  `src/lib/mock/second-brain.ts`:

  | Cạnh | Chiều thuận | Chiều ngược | |
  |---|---|---|---|
  | `cap_01` ↔ `cap_04` | `cap_01.linkedIds` có `cap_04` | `cap_04.linkedIds` = `["cap_05","cap_06"]` — **thiếu `cap_01`** | ✗ |
  | `cap_11` ↔ `cap_09` | `cap_11.linkedIds` có `cap_09` | `cap_09.linkedIds` = `["cap_02","cap_03"]` — **thiếu `cap_11`** | ✗ |
  | `cap_12` ↔ `cap_06` | `cap_12.linkedIds` có `cap_06` | `cap_06.linkedIds` = `["cap_04","cap_05"]` — **thiếu `cap_12`** | ✗ |

  Chín cặp còn lại đối xứng đúng (`cap_01`↔`cap_07`, `cap_02`↔`cap_07`,
  `cap_02`↔`cap_09`, `cap_03`↔`cap_08`, `cap_03`↔`cap_09`, `cap_04`↔`cap_05`,
  `cap_04`↔`cap_06`, `cap_05`↔`cap_06`).

  Đây **chính xác là failure mode** mô tả ở
  [mục liên kết](#hệ-quả-ghi-một-dòng-là-graph-khuyết-cạnh), đang nằm sẵn trong
  repo: mở `cap_01` thấy liên kết tới `cap_04`, mở `cap_04` thì không thấy
  `cap_01` đâu. Mock chưa lộ ra vì `GraphView` hiện đọc `knowledgeGraph` viết
  tay, không đọc `linkedIds` — nhưng seed thẳng dữ liệu này vào database là bê
  nguyên ba cạnh khuyết vào sản phẩm.

  **Khi viết seed, đừng đọc `linkedIds` từng chiều một.** Chuẩn hoá trước: gom
  thành tập cặp không thứ tự, rồi sinh 2 dòng cho mỗi cặp.

  ```ts
  // Gom mọi cặp về dạng chuẩn (nhỏ trước) để (A,B) và (B,A) trùng khoá.
  const pairs = new Set<string>();
  for (const c of captures) {
    for (const to of c.linkedIds) {
      pairs.add([c.id, to].sort().join("|"));
    }
  }
  // 12 cặp — kể cả 3 cặp chỉ khai báo một chiều.
  const rows = [...pairs].flatMap((p) => {
    const [a, b] = p.split("|");
    return [{ fromId: a, toId: b }, { fromId: b, toId: a }];
  });
  await prisma.captureLink.createMany({ data: rows, skipDuplicates: true });
  ```

  Cách này biến ba cạnh lệch thành ba cạnh đủ. Nếu muốn giữ mock đúng như dữ liệu
  sẽ có, sửa luôn ba chỗ trong `second-brain.ts`: thêm `"cap_01"` vào
  `cap_04.linkedIds`, `"cap_11"` vào `cap_09.linkedIds`, `"cap_12"` vào
  `cap_06.linkedIds`.

- **`linkedIds` chỉ cần một truy vấn một cột** — đó là toàn bộ lý do lưu hai
  dòng:

  ```ts
  const capture = await prisma.capture.findFirst({
    where: { id: params.id, userId: session.userId },
    include: { linksFrom: { select: { toId: true } } },
  });
  if (!capture) return notFound();

  return {
    ...capture,
    tags: JSON.parse(capture.tags),
    linkedIds: capture.linksFrom.map((l) => l.toId),
  };
  ```

  `linksFrom` là quan hệ theo `fromId`, đã có `@@index([fromId])`. **Không cần**
  đọc `linksTo` — nếu dữ liệu đối xứng đúng thì nó chứa cùng tập id. Đọc cả hai
  rồi hợp nhất là đang tự vá cho một bất biến mà lẽ ra tầng ghi phải giữ, và nó
  sẽ giấu đi đúng cái bug cần thấy.

- **Với danh sách, `include` linksFrom cho cả trang một lần** — đừng gọi từng
  capture một. Prisma gộp thành một truy vấn phụ duy nhất:

  ```ts
  const rows = await prisma.capture.findMany({
    where: { userId: session.userId, type },
    include: { linksFrom: { select: { toId: true } } },
    orderBy: { createdAt: "desc" },
    skip, take,
  });
  ```

- **Khử trùng lặp cạnh cho `GET /api/graph`** — hai cách, chọn theo khẩu vị:

  ```ts
  // Cách 1: lọc ở SQL. Chỉ lấy dòng có fromId < toId theo thứ tự chuỗi.
  const links = await prisma.$queryRaw`
    SELECT fromId, toId FROM CaptureLink
    WHERE fromId < toId AND fromId IN (SELECT id FROM Capture WHERE userId = ${userId})
  `;

  // Cách 2: lọc trong bộ nhớ. Không cần raw SQL, đủ nhanh ở quy mô cá nhân.
  const seen = new Set<string>();
  const edges = links.filter(({ fromId, toId }) => {
    const key = [fromId, toId].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  ```

  Cách 1 chỉ đúng **nếu dữ liệu đối xứng** — với cạnh khuyết một dòng, dòng còn
  lại có thể là `(B,A)` với `B > A` và cạnh đó **biến mất hoàn toàn** khỏi đồ thị.
  Cách 2 giữ được cạnh trong cả hai trường hợp. Ở quy mô này, chọn cách 2 và ngủ
  ngon.

- **`CaptureLink` không có `userId`.** Quyền sở hữu suy ra qua `Capture`. Truy vấn
  cạnh cho `/api/graph` **phải** đi qua capture của người dùng:

  ```ts
  const links = await prisma.captureLink.findMany({
    where: { from: { userId: session.userId } },
    select: { fromId: true, toId: true },
  });
  ```

  `where: { from: { userId } }` là điều kiện bắt buộc, không phải tối ưu. Bỏ nó ra
  là trả về toàn bộ liên kết của **mọi người dùng**. Nếu quy tắc "`toId` phải
  thuộc về chính mình" ở `POST .../links` được giữ đúng, lọc theo `from` là đủ —
  hai đầu cạnh luôn cùng một chủ.

- **`@@unique([fromId, toId])` chỉ chặn trùng trong một chiều.** Nó **không** biết
  `(A,B)` và `(B,A)` là cùng một cạnh — với database đó là hai khoá khác nhau.
  Ràng buộc này giúp `skipDuplicates` hoạt động, nhưng **không** thay thế được
  việc tầng API phải ghi đủ hai dòng. Database không giữ hộ tính đối xứng.

- **Transaction cho `POST .../links` là bắt buộc.** `createMany` với hai phần tử
  đã là một câu lệnh nguyên tử trong SQLite, nên `$transaction` bọc ngoài là thừa
  **nếu** dùng đúng một `createMany`. Nhưng nếu viết thành hai `create` riêng —
  cách rất dễ viết ra — thì transaction là thứ duy nhất ngăn dữ liệu lệch khi
  tiến trình chết giữa chừng. Dùng một `createMany`, hoặc bọc `$transaction`.
  Đừng gọi hai `create` trần.

- **`GET /api/graph` không cần phân trang nhưng cần chốt chặn.** Đồ thị 10.000
  node không vẽ được mà cũng không đọc được. Nếu số capture vượt ngưỡng (vài
  nghìn), cân nhắc chỉ trả node `starred` cộng hàng xóm trực tiếp của chúng, hoặc
  thêm tham số `?rootId=&depth=` để duyệt từ một node. Chưa cần bây giờ — mock có
  12 capture — nhưng đừng để `GET /api/graph` là truy vấn không giới hạn mãi mãi.

- **Lọc `?tag=` không dùng được index**, cùng lý do và cùng cách xử lý như
  `PersonalDocument.tags` — xem
  [documents.md](documents.md#ghi-chú-khi-hiện-thực). Nhớ phân trang **sau** khi
  lọc trong bộ nhớ, nếu không `meta.total` sẽ sai.

- **Index hiện có**: `@@index([userId, type])` phục vụ `?type=note`;
  `@@index([userId, createdAt])` phục vụ danh sách mặc định sắp theo `-createdAt`.
  Không có index nào cho `starred` — `?starred=true` sẽ quét sau khi lọc `userId`.
  Chấp nhận được ở quy mô cá nhân; nếu cần, thêm `@@index([userId, starred])` như
  `EmailMessage` đang có.

- **Lọc theo `userId` từ phiên**, không bao giờ từ query param. Xem
  [README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).

- **Response không trả `updatedAt`.** Cột này có trong Prisma model nhưng không có
  trong type `Capture`. Nhớ `select` đúng trường. Nếu thêm `sourceId` cho
  `save-to-brain` (xem [email.md](email.md#ghi-chú-khi-hiện-thực)), cột đó cũng
  phải nằm ngoài response.
