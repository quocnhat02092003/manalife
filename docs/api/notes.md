# Ghi chú API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module này quản lý ghi chú dạng Markdown, có tag và ghim. Map tới model `Note`
trong `prisma/schema.prisma`, shape response khớp `Note` trong
`src/types/index.ts`.

Khác biệt đáng chú ý giữa hai tầng: cột `tags` trong database là **chuỗi JSON**,
còn API nhận và trả **mảng thật**. Xem quy tắc 1 — đây là chỗ dễ sai nhất của
module.

Các ví dụ bên dưới lấy từ `src/lib/mock/notes.ts`, neo vào ngày `2026-07-15`.

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/notes` | Danh sách ghi chú, lọc theo từ khoá/tag/ghim. |
| POST | `/api/notes` | Tạo ghi chú mới. |
| GET | `/api/notes/:id` | Chi tiết một ghi chú. |
| PATCH | `/api/notes/:id` | Sửa một phần ghi chú. |
| DELETE | `/api/notes/:id` | Xoá ghi chú. |

## GET /api/notes

Trả về ghi chú của người dùng đang đăng nhập, mới sửa gần nhất lên trước.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `q` | chuỗi | không | — | Tìm trong `title` và `body`, không phân biệt hoa thường. |
| `tag` | chuỗi | không | — | Lọc ghi chú có chứa tag này. So khớp chính xác cả tag, không phải tiền tố. |
| `pinned` | boolean | không | — | `true` chỉ lấy ghi chú đã ghim, `false` chỉ lấy chưa ghim. Bỏ trống = lấy cả hai. |
| `sort` | chuỗi | không | `-updatedAt` | Cho phép: `updatedAt`, `createdAt`, `title`. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. |

Ghi chú đã ghim **không** tự động được đẩy lên đầu — `sort` quyết định thứ tự.
UI muốn tách nhóm ghim thì gọi hai lần với `pinned=true` và `pinned=false`, hoặc
tự nhóm ở client.

**Response 200** — `GET /api/notes?pinned=true`

```json
{
  "data": [
    {
      "id": "not_01",
      "title": "Ý tưởng nội dung: Series \"Productive Week\" cho blog",
      "body": "Mỗi thứ Hai đăng một bài ngắn về cách sắp xếp tuần làm việc.\n\n- Tuần 1: chọn 3 việc quan trọng nhất\n- Tuần 2: time-boxing\n- Tuần 3: review cuối tuần",
      "tags": ["nội dung", "blog"],
      "pinned": true,
      "color": "violet",
      "createdAt": "2026-07-15T10:15:00.000Z",
      "updatedAt": "2026-07-15T10:15:00.000Z"
    },
    {
      "id": "not_04",
      "title": "Câu hỏi phỏng vấn người dùng",
      "body": "1. Bạn đang giải quyết việc này thế nào?\n2. Lần gần nhất bạn gặp khó khăn là khi nào?\n3. Nếu có cây đũa thần, bạn muốn điều gì xảy ra?",
      "tags": ["nghiên cứu", "side project"],
      "pinned": true,
      "color": "sage",
      "createdAt": "2026-07-13T14:30:00.000Z",
      "updatedAt": "2026-07-13T15:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 2, "totalPages": 1 }
}
```

`tags` luôn là mảng — kể cả ghi chú không có tag nào thì trả `[]`, không phải
`null` và không phải chuỗi `"[]"`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `pinned` không phải `true`/`false`, `sort` ngoài danh sách cho phép. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/notes

Tạo ghi chú mới.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `title` | chuỗi | có | — | 1–200 ký tự, không rỗng sau trim. |
| `body` | chuỗi | có | — | Markdown. Được phép là chuỗi rỗng. |
| `tags` | chuỗi[] | không | `[]` | **Mảng thật**, không phải chuỗi JSON. Xem quy tắc 1. |
| `pinned` | boolean | không | `false` | |
| `color` | `EventColor` | không | `"brand"` | `brand` \| `clay` \| `violet` \| `sage` \| `sand`. |

`createdAt`/`updatedAt` do server sinh.

```json
{
  "title": "Đọc lại Atomic Habits — Chương 3",
  "body": "Ba lớp thay đổi hành vi: kết quả → quy trình → bản dạng.\nThay đổi bền vững bắt đầu từ câu hỏi *mình muốn trở thành ai*, không phải *mình muốn đạt được gì*.",
  "tags": ["sách", "thói quen"],
  "pinned": false,
  "color": "brand"
}
```

**Response 201**

```json
{
  "data": {
    "id": "not_02",
    "title": "Đọc lại Atomic Habits — Chương 3",
    "body": "Ba lớp thay đổi hành vi: kết quả → quy trình → bản dạng.\nThay đổi bền vững bắt đầu từ câu hỏi *mình muốn trở thành ai*, không phải *mình muốn đạt được gì*.",
    "tags": ["sách", "thói quen"],
    "pinned": false,
    "color": "brand",
    "createdAt": "2026-07-14T21:40:00.000Z",
    "updatedAt": "2026-07-14T21:40:00.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `title`/`body`; `tags` không phải mảng chuỗi; `color` ngoài tập `EventColor`. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 422 | `UNPROCESSABLE` | Vi phạm giới hạn tag: quá 10 tag, hoặc một tag dài quá 30 ký tự. |

## GET /api/notes/:id

Chi tiết một ghi chú, kèm toàn văn `body`.

**Query params** — không có.

**Response 200**

```json
{
  "data": {
    "id": "not_03",
    "title": "Công thức nấu ăn healthy cho tuần mới",
    "body": "Ức gà áp chảo + quinoa + bông cải xanh.\nSốt: dầu ô liu, chanh, tỏi băm, chút mật ong.",
    "tags": ["sức khoẻ", "nấu ăn"],
    "pinned": false,
    "color": "clay",
    "createdAt": "2026-07-14T19:05:00.000Z",
    "updatedAt": "2026-07-14T19:05:00.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là ghi chú của người khác. |

## PATCH /api/notes/:id

Sửa một phần ghi chú. Chỉ gửi trường muốn đổi.

**Request body** — mọi trường của `POST` đều tuỳ chọn.

`tags` **thay thế toàn bộ**, không cộng dồn. Gửi `"tags": []` là xoá hết tag;
muốn thêm một tag thì client gửi lại cả mảng cũ kèm tag mới. Không có endpoint
riêng để thêm/bớt từng tag.

```json
{ "pinned": true, "tags": ["nghiên cứu", "side project"] }
```

**Response 200** — `updatedAt` được server làm mới:

```json
{
  "data": {
    "id": "not_04",
    "title": "Câu hỏi phỏng vấn người dùng",
    "body": "1. Bạn đang giải quyết việc này thế nào?\n2. Lần gần nhất bạn gặp khó khăn là khi nào?\n3. Nếu có cây đũa thần, bạn muốn điều gì xảy ra?",
    "tags": ["nghiên cứu", "side project"],
    "pinned": true,
    "color": "sage",
    "createdAt": "2026-07-13T14:30:00.000Z",
    "updatedAt": "2026-07-13T15:00:00.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `tags` không phải mảng chuỗi; `color` ngoài tập cho phép; `title` rỗng. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là ghi chú của người khác. |
| 422 | `UNPROCESSABLE` | Quá 10 tag, hoặc một tag dài quá 30 ký tự. |

## DELETE /api/notes/:id

Xoá vĩnh viễn một ghi chú. Không có thùng rác, không hoàn tác được.

**Response 200**

```json
{ "data": { "id": "not_05", "deleted": true } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là ghi chú của người khác. |

## Quy tắc nghiệp vụ

1. **`tags` là mảng ở API, chuỗi JSON ở database.** Cột `Note.tags` khai báo
   `String @default("[]")` vì SQLite không có kiểu mảng. Hợp đồng với client
   **không** phản ánh chi tiết lưu trữ này: API luôn nhận và trả
   `["sách","thói quen"]`, không bao giờ trả `"[\"sách\",\"thói quen\"]"`.
   Serialize khi ghi, parse khi đọc — ở tầng API, không đẩy sang client.
2. **Chuẩn hoá tag trước khi lưu:** trim khoảng trắng, bỏ tag rỗng, khử trùng lặp,
   giữ nguyên thứ tự client gửi. Tag phân biệt hoa thường (`"Sách"` và `"sách"`
   là hai tag khác nhau) — nếu muốn khác, chuẩn hoá về chữ thường ngay ở bước này
   chứ đừng vá lúc truy vấn.
3. **Giới hạn tag:** tối đa 10 tag mỗi ghi chú, mỗi tag tối đa 30 ký tự. Vượt →
   `422 UNPROCESSABLE`. Giới hạn này giữ cột JSON không phình to và bảo vệ điều
   kiện `LIKE` khi lọc theo tag.
4. **`tags` khi `PATCH` là thay thế toàn bộ**, không merge.
5. **`body` là Markdown**, lưu và trả về **nguyên văn** — server không render,
   không sanitize, không escape. Việc render là của client, và **client phải
   sanitize khi render** (`body` là dữ liệu người dùng nhập; render thô ra HTML
   là lỗ hổng XSS). Server chỉ giới hạn độ dài, gợi ý 100 000 ký tự.
6. **`title` bắt buộc, `body` được phép rỗng.** Ghi chú không tiêu đề thì không
   hiển thị được trong danh sách; ghi chú chỉ có tiêu đề thì vẫn hợp lệ.
7. **`color` phải thuộc `EventColor`**: `brand` | `clay` | `violet` | `sage` |
   `sand`. SQLite lưu `String` nên database không chặn — server phải kiểm tra.
8. **`pinned` chỉ là cờ**, không giới hạn số lượng ghi chú được ghim và không ảnh
   hưởng thứ tự sắp xếp mặc định.

## Ghi chú khi hiện thực

- **Parse/serialize `tags` đúng một chỗ.** Đây là cạm bẫy chính của module: quên
  parse thì client nhận chuỗi thay vì mảng và `note.tags.map()` nổ; quên
  serialize thì Prisma từ chối ghi mảng vào cột `String`. Viết hai hàm và bắt mọi
  route đi qua chúng — đừng rải `JSON.parse` khắp các handler.

  ```ts
  // Đọc: hàng database -> shape API
  function toNote(row: PrismaNote): Note {
    return { ...row, tags: JSON.parse(row.tags) as string[] };
  }

  // Ghi: body API -> hàng database
  const data = { ...input, tags: JSON.stringify(normalizeTags(input.tags)) };
  ```

  `JSON.parse` phải bọc `try/catch` hoặc mặc định về `[]`. Dữ liệu ghi bằng phiên
  bản cũ, seed viết tay, hoặc sửa trực tiếp bằng công cụ database đều có thể để
  lại giá trị không parse được — và một hàng hỏng sẽ làm hỏng **cả trang danh
  sách**, không chỉ một ghi chú.

- **Lọc theo `tag` không dùng được index.** `tags` là cột JSON, index duy nhất
  của `Note` là `@@index([userId, updatedAt])`. Cách khả thi là `contains` trên
  chuỗi thô, sau khi đã thu hẹp theo `userId`:

  ```ts
  where: { userId: session.userId, tags: { contains: `"${tag}"` } }
  ```

  Bọc tag trong dấu nháy kép để `"sách"` không khớp nhầm `"sách nói"` — nhưng đây
  là mẹo chuỗi, không phải truy vấn có ngữ nghĩa: nó vẫn quét mọi ghi chú của
  người dùng, và tag chứa ký tự `"` hoặc `\` sẽ bị JSON escape nên chuỗi tìm
  không còn khớp. **Chuẩn hoá tag chặt (quy tắc 2) là điều kiện để mẹo này đúng.**

  Ở quy mô vài trăm ghi chú mỗi người thì chấp nhận được. Nếu dữ liệu lớn hoặc
  cần đếm/gợi ý tag, tách bảng `Tag` + bảng nối `NoteTag` (`@@unique([noteId, tagId])`)
  — lọc theo tag thành join có index, và đếm số ghi chú mỗi tag thành một câu
  `groupBy` thay vì đọc hết rồi đếm trong bộ nhớ. Trên PostgreSQL còn một lựa chọn
  nữa: đổi cột sang `String[]` hoặc `Jsonb` rồi đánh index GIN. SQLite không có
  cửa đó.

- **`q` cũng là quét tuần tự.** `contains` trên `title` và `body` không có index
  hỗ trợ:

  ```ts
  where: {
    userId: session.userId,
    OR: [{ title: { contains: q } }, { body: { contains: q } }],
  }
  ```

  SQLite `LIKE` mặc định chỉ không phân biệt hoa thường với ký tự ASCII — tiếng
  Việt có dấu **sẽ phân biệt** hoa thường. Prisma `mode: "insensitive"` không hỗ
  trợ trên SQLite. Nếu cần tìm kiếm nghiêm túc, dùng FTS5 (SQLite) hoặc
  `tsvector` (PostgreSQL); xem thêm [search.md](search.md).

- **Sắp xếp mặc định `-updatedAt` khớp đúng `@@index([userId, updatedAt])`** —
  đây là đường đi nhanh của module. Mọi bộ lọc (`q`, `tag`) đều chỉ là quét thêm
  sau khi index đã thu hẹp theo `userId`, nên **luôn giữ `userId` trong `where`**,
  kể cả khi có vẻ thừa.
- **Đừng tự set `updatedAt`** — cột khai báo `@updatedAt`, Prisma tự cập nhật mỗi
  lần `update`. Gán tay sẽ ghi đè giá trị đúng.
- **Lọc theo `userId` từ phiên**, không bao giờ từ query param. `PATCH`/`DELETE`
  dùng `updateMany`/`deleteMany` kèm `userId` trong `where`, kiểm tra `count` để
  trả `404`. Xem [README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).
- Response `Note` trả đúng 8 trường của type — không có `userId`. Nhớ `select`
  đúng trường, và nhớ `tags` phải qua `toNote()` chứ không trả thẳng hàng Prisma.
