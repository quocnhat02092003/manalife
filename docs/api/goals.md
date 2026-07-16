# Mục tiêu API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module quản lý mục tiêu dài hạn của người dùng và các cột mốc con bên trong mỗi
mục tiêu. Map tới model `Goal` và `Milestone` trong `prisma/schema.prisma`, khớp
kiểu `Goal` / `Milestone` trong `src/types/index.ts`.

Cột mốc không có endpoint danh sách riêng: chúng luôn đi kèm mục tiêu cha khi
đọc, và chỉ tách ra endpoint riêng khi ghi.

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/goals` | Danh sách mục tiêu, kèm cột mốc. |
| POST | `/api/goals` | Tạo mục tiêu mới. |
| GET | `/api/goals/:id` | Chi tiết một mục tiêu, kèm cột mốc. |
| PATCH | `/api/goals/:id` | Cập nhật một phần mục tiêu. |
| DELETE | `/api/goals/:id` | Xoá mục tiêu và toàn bộ cột mốc của nó. |
| POST | `/api/goals/:id/milestones` | Thêm cột mốc vào mục tiêu. |
| PATCH | `/api/milestones/:id` | Cập nhật cột mốc. |
| DELETE | `/api/milestones/:id` | Xoá cột mốc. |

## GET /api/goals

Trả về danh sách mục tiêu của người dùng đang đăng nhập, mỗi mục tiêu kèm mảng
`milestones` đã sắp theo `Milestone.order` tăng dần.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `status` | `active` \| `done` \| `paused` | không | — | Lọc theo trạng thái. Bỏ trống thì trả mọi trạng thái. |
| `horizon` | `quarter` \| `year` \| `life` | không | — | Lọc theo khung thời gian. |
| `q` | string | không | — | Tìm trong `title` và `description`. |
| `sort` | string | không | `-createdAt` | Cho phép: `createdAt`, `dueAt`, `title`. Thêm `-` để giảm dần. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. |

**Response 200**

```json
{
  "data": [
    {
      "id": "gol_01",
      "title": "Đọc 24 cuốn sách trong năm",
      "description": "Hai cuốn mỗi tháng, ưu tiên sách về tư duy và thiết kế.",
      "status": "active",
      "horizon": "year",
      "progressCurrent": 14,
      "progressTarget": 24,
      "unit": "cuốn",
      "dueAt": "2026-12-30T09:00:00.000Z",
      "milestones": [
        { "id": "mst_01", "title": "Hết quý 1 — 6 cuốn", "done": true, "dueAt": "2026-04-06T09:00:00.000Z" },
        { "id": "mst_02", "title": "Hết quý 2 — 12 cuốn", "done": true, "dueAt": "2026-07-05T09:00:00.000Z" },
        { "id": "mst_03", "title": "Hết quý 3 — 18 cuốn", "done": false, "dueAt": "2026-10-03T09:00:00.000Z" },
        { "id": "mst_04", "title": "Hết quý 4 — 24 cuốn", "done": false, "dueAt": "2026-12-30T09:00:00.000Z" }
      ]
    },
    {
      "id": "gol_03",
      "title": "Tiết kiệm 120 triệu",
      "description": "Quỹ dự phòng 6 tháng chi tiêu.",
      "status": "active",
      "horizon": "year",
      "progressCurrent": 78000000,
      "progressTarget": 120000000,
      "unit": "₫",
      "dueAt": "2026-12-30T09:00:00.000Z",
      "milestones": [
        { "id": "mst_10", "title": "Đạt 40 triệu", "done": true, "dueAt": "2026-03-17T09:00:00.000Z" },
        { "id": "mst_11", "title": "Đạt 80 triệu", "done": false, "dueAt": "2026-08-04T09:00:00.000Z" },
        { "id": "mst_12", "title": "Đạt 120 triệu", "done": false, "dueAt": "2026-12-30T09:00:00.000Z" }
      ]
    },
    {
      "id": "gol_05",
      "title": "Học tiếng Nhật N4",
      "description": "Tạm dừng tới khi side project ra mắt.",
      "status": "paused",
      "horizon": "year",
      "progressCurrent": 320,
      "progressTarget": 800,
      "unit": "từ vựng",
      "dueAt": "2027-01-31T09:00:00.000Z",
      "milestones": [
        { "id": "mst_16", "title": "Thuộc 400 từ", "done": false, "dueAt": "2026-09-13T09:00:00.000Z" }
      ]
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 6, "totalPages": 1 }
}
```

(Ví dụ rút gọn còn 3 trong 6 mục tiêu của dữ liệu mẫu cho dễ đọc — response thật
trả đủ 6.)

Cột mốc lấy bằng `include`, không phải truy vấn rời:

```ts
const goals = await prisma.goal.findMany({
  where: { userId: session.userId, ...filters },
  include: { milestones: { orderBy: { order: "asc" } } },
});
```

Nếu lấy mục tiêu trước rồi lặp qua từng mục tiêu để query cột mốc, sẽ thành N+1
query. `include` gộp thành 2 query bất kể có bao nhiêu mục tiêu.

Trường `order` **không** xuất hiện trong response: kiểu `Milestone` ở
`src/types/index.ts` không có nó. Nó chỉ dùng để sắp xếp ở server.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `status`, `horizon` hoặc `sort` không thuộc tập giá trị hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/goals

Tạo mục tiêu mới. Có thể kèm cột mốc ngay lúc tạo.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `title` | string | có | — | 1–200 ký tự. |
| `description` | string \| null | không | `null` | |
| `status` | `active` \| `done` \| `paused` | không | `active` | |
| `horizon` | `quarter` \| `year` \| `life` | không | `quarter` | |
| `progressCurrent` | số nguyên | không | `0` | ≥ 0. |
| `progressTarget` | số nguyên | có | — | Phải > 0. |
| `unit` | string | có | — | Đơn vị hiển thị: `"cuốn"`, `"km"`, `"₫"`… |
| `dueAt` | ISO 8601 \| null | không | `null` | |
| `milestones` | mảng | không | `[]` | Mỗi phần tử: `title` (bắt buộc), `dueAt`, `done`. |

```json
{
  "title": "Tiết kiệm 120 triệu",
  "description": "Quỹ dự phòng 6 tháng chi tiêu.",
  "horizon": "year",
  "progressCurrent": 78000000,
  "progressTarget": 120000000,
  "unit": "₫",
  "dueAt": "2026-12-30T09:00:00.000Z",
  "milestones": [
    { "title": "Đạt 40 triệu", "done": true, "dueAt": "2026-03-17T09:00:00.000Z" },
    { "title": "Đạt 80 triệu", "dueAt": "2026-08-04T09:00:00.000Z" }
  ]
}
```

Khi tạo kèm `milestones`, server tự gán `order` theo đúng thứ tự phần tử trong
mảng (0, 1, 2…). Client không gửi `order`.

**Response 201** — mục tiêu vừa tạo, shape giống một phần tử của `GET /api/goals`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `title`/`progressTarget`/`unit`, hoặc enum sai, hoặc `progressCurrent` âm. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 422 | `UNPROCESSABLE` | `progressTarget` ≤ 0. |

## GET /api/goals/:id

Chi tiết một mục tiêu, kèm `milestones` sắp theo `order`.

**Response 200** — một object `Goal`, giống phần tử trong `GET /api/goals`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## PATCH /api/goals/:id

Cập nhật một phần mục tiêu. Chỉ gửi trường cần đổi.

Nhận cùng tập trường như `POST /api/goals`, **trừ** `milestones` — sửa cột mốc
phải dùng endpoint riêng bên dưới. Lý do: gửi lại toàn mảng `milestones` trong
`PATCH` buộc phải đoán phần tử nào là thêm/sửa/xoá, và hai tab mở song song sẽ
ghi đè lẫn nhau.

**Request body** (ví dụ — cập nhật tiến độ tiết kiệm):

```json
{ "progressCurrent": 82000000 }
```

**Response 200** — mục tiêu sau khi cập nhật.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Trường gửi lên sai kiểu hoặc enum sai. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |
| 422 | `UNPROCESSABLE` | `progressTarget` ≤ 0. |

## DELETE /api/goals/:id

Xoá mục tiêu. Toàn bộ cột mốc của nó bị xoá theo — quan hệ `Milestone.goal` khai
báo `onDelete: Cascade`, database tự dọn.

**Response 204** — không có body.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## POST /api/goals/:id/milestones

Thêm một cột mốc vào mục tiêu `:id`.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `title` | string | có | — | 1–200 ký tự. |
| `done` | boolean | không | `false` | |
| `dueAt` | ISO 8601 \| null | không | `null` | |
| `order` | số nguyên | không | cuối danh sách | Vị trí hiển thị. |

```json
{ "title": "Đạt 100 triệu", "dueAt": "2026-10-03T09:00:00.000Z" }
```

Bỏ trống `order` thì server gán `max(order) + 1` trong cùng mục tiêu, tức là cột
mốc mới nằm cuối danh sách.

**Response 201**

```json
{
  "data": { "id": "mst_21", "title": "Đạt 100 triệu", "done": false, "dueAt": "2026-10-03T09:00:00.000Z" }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `title` hoặc sai kiểu. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Mục tiêu `:id` không tồn tại, hoặc thuộc người dùng khác. |

## PATCH /api/milestones/:id

Cập nhật cột mốc. Dùng nhiều nhất để tick `done`.

Không cho đổi `goalId` — chuyển cột mốc sang mục tiêu khác không phải thao tác
có trong giao diện, và mở ra đường ghi dữ liệu vào mục tiêu của người khác.

**Request body**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | string | không | 1–200 ký tự. |
| `done` | boolean | không | |
| `dueAt` | ISO 8601 \| null | không | |
| `order` | số nguyên | không | Vị trí hiển thị. |

```json
{ "done": true }
```

**Response 200** — cột mốc sau khi cập nhật.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Trường sai kiểu. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc mục tiêu cha thuộc người dùng khác. |

## DELETE /api/milestones/:id

Xoá cột mốc. Không đánh lại `order` cho các cột mốc còn lại — thứ tự tương đối
vẫn đúng dù dãy số có lỗ (0, 1, 3, 4).

**Response 204** — không có body.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc mục tiêu cha thuộc người dùng khác. |

## Quy tắc nghiệp vụ

### `progressCurrent` / `progressTarget` là số nguyên

Cả hai khai báo `Int` trong schema. Với `unit: "₫"`, giá trị lưu **bằng đồng**:
mục tiêu `gol_03` là `78000000 / 120000000`, không phải `78 / 120` triệu.

Không dùng `Float` cho tiền, kể cả khi đơn vị trông "to". Số thực nhị phân không
biểu diễn chính xác được số thập phân — `0.1 + 0.2 !== 0.3` — và sai số tích luỹ
mỗi lần cộng dồn tiến độ. Đồng là đơn vị nhỏ nhất của VND, nên số nguyên đồng
không mất mát gì. Cùng lý do với `Expense.amount`, xem [expenses.md](expenses.md).

`Int` của SQLite/PostgreSQL là 32-bit có dấu, trần khoảng 2,1 tỉ đồng. Đủ cho
mục tiêu tiết kiệm cá nhân. Nếu sau này cần vượt mức đó thì đổi sang `BigInt` và
serialize thành string trong JSON — `Number` của JavaScript chỉ an toàn tới 2^53.

Với đơn vị không phải tiền (`"cuốn"`, `"km"`, `"cột mốc"`, `"từ vựng"`), số
nguyên cũng là đúng: không ai đọc 14,5 cuốn sách. Nếu cần độ chính xác lẻ (ví dụ
16,5 km), quy ước là đổi đơn vị nhỏ hơn — lưu bằng mét — chứ không đổi sang
`Float`.

### `progressTarget` phải > 0

Vi phạm → `422 UNPROCESSABLE`. Đúng kiểu dữ liệu (là số nguyên) nhưng vô nghĩa về
nghiệp vụ, nên là 422 chứ không phải 400.

Target bằng 0 làm phép tính `progressCurrent / progressTarget` chia cho 0, ra
`Infinity` hoặc `NaN` và thanh tiến độ ở giao diện vỡ. Target âm thì tiến độ chạy
ngược. Chặn ngay ở tầng ghi rẻ hơn nhiều so với phòng thủ ở mọi chỗ đọc.

### `progressCurrent` được phép vượt `progressTarget`

**Đây là dữ liệu hợp lệ, không phải lỗi.** Đọc 26 cuốn khi đặt mục tiêu 24 cuốn
là hoàn thành hơn dự kiến. Server **không** kẹp giá trị, **không** trả 422, và
**không** tự đổi `status` sang `done` — dữ liệu phải giữ nguyên sự thật là người
dùng đã vượt mục tiêu bao nhiêu.

Việc kẹp thuộc về tầng hiển thị: client tự giới hạn về 100% khi vẽ thanh tiến độ:

```ts
const percent = Math.min(100, Math.round((goal.progressCurrent / goal.progressTarget) * 100));
```

Nếu server kẹp, thông tin "vượt 2 cuốn" biến mất vĩnh viễn khỏi database.

`progressCurrent` âm thì bị chặn (400) — không có ngữ cảnh nào tiến độ âm có
nghĩa.

### `status` và `horizon` được kiểm tra ở tầng API

SQLite không có kiểu enum nên hai cột này là `String`, database không chặn giá
trị sai. Server phải đối chiếu với `GoalStatus` và `GoalHorizon` trước khi ghi,
nếu không `status: "xong"` sẽ lọt vào database và biến mất khỏi mọi bộ lọc.

`status` không tự động suy ra từ tiến độ. Người dùng tự đặt: `gol_05` đang
`paused` ở mức 320/800, và `gol_06` là `done` ở 4/4 — nhưng một mục tiêu đạt
4/4 vẫn có thể ở trạng thái `active` nếu người dùng chưa chốt.

### `Milestone.order` quyết định thứ tự hiển thị

Cột mốc **luôn** trả về theo `order` tăng dần, không theo `createdAt` hay `id`.
Thứ tự cột mốc mang ý nghĩa: "Hết quý 1 — 6 cuốn" phải đứng trước "Hết quý 2 —
12 cuốn", kể cả khi người dùng nhập cột mốc quý 2 trước.

Không sắp theo `dueAt`: cột mốc được phép có `dueAt: null`, và các cột mốc null
sẽ rơi về một đầu danh sách một cách tuỳ tiện.

Sắp xếp lại: client gửi nhiều lệnh `PATCH /api/milestones/:id` với `order` mới.
`order` không có ràng buộc duy nhất — hai cột mốc cùng `order` không gây lỗi, chỉ
là thứ tự giữa chúng không xác định.

## Ghi chú khi hiện thực

1. Route handler: `src/app/api/goals/route.ts`,
   `src/app/api/goals/[id]/route.ts`, `src/app/api/goals/[id]/milestones/route.ts`,
   `src/app/api/milestones/[id]/route.ts`.
2. **`Milestone` không có cột `userId`.** Quyền sở hữu đi qua `Goal`. Mọi thao
   tác trên cột mốc phải kiểm tra qua quan hệ, không được query thẳng theo id:

   ```ts
   // ĐÚNG — ràng buộc quyền sở hữu qua goal.
   const milestone = await prisma.milestone.findFirst({
     where: { id: params.id, goal: { userId: session.userId } },
   });
   if (!milestone) return notFound();

   // SAI — sửa được cột mốc của bất kỳ ai nếu biết id.
   await prisma.milestone.update({ where: { id: params.id }, data });
   ```

   Đây là chỗ dễ sai nhất của module này: `Goal` có `userId` nên quy tắc phân
   tách dữ liệu trong README áp dụng thẳng, còn `Milestone` thì không.
3. Tạo mục tiêu kèm `milestones` dùng nested write của Prisma
   (`data: { ..., milestones: { create: [...] } }`) để mục tiêu và cột mốc nằm
   trong cùng một transaction. Nếu tách hai lệnh và lệnh thứ hai lỗi, sẽ còn lại
   một mục tiêu rỗng.
4. Index `@@index([userId, status])` phục vụ đúng truy vấn
   `GET /api/goals?status=active`. Lọc theo `horizon` không có index riêng — số
   mục tiêu mỗi người vốn nhỏ (hàng chục), quét sau khi đã lọc `userId` là đủ
   nhanh. Chỉ thêm index khi đo được là chậm.
5. Giao diện hiện đọc `goals` từ `src/lib/mock/goals.ts`, trong đó cột mốc đã
   nằm sẵn trong `goal.milestones`. Response của `GET /api/goals` khớp đúng shape
   đó, nên khi nối API chỉ cần thay import bằng fetch.
