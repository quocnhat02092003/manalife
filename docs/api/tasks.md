# Công việc API

> **Trạng thái: ĐÃ HIỆN THỰC** — route handler trong `src/app/api/tasks*` và
> `src/app/api/projects*`, validate + logic `completedAt` dùng chung trong
> `src/lib/api/tasks.ts`. Giao diện `/tasks` và widget dashboard chạy trên
> dữ liệu thật. Xem [README.md](README.md) cho quy ước chung.

Module này quản lý công việc và dự án gom nhóm chúng. Map tới model `Task` và
`Project` trong `prisma/schema.prisma`; shape response khớp `Task` và `Project`
trong `src/types/index.ts`.

Quan hệ: một dự án có nhiều việc, một việc thuộc tối đa một dự án
(`projectId` nullable). Các ví dụ bên dưới lấy từ `src/lib/mock/tasks.ts`, neo
vào ngày `2026-07-15`.

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/tasks` | Danh sách việc, lọc theo trạng thái/dự án/độ ưu tiên/hạn. |
| POST | `/api/tasks` | Tạo việc mới. |
| GET | `/api/tasks/:id` | Chi tiết một việc. |
| PATCH | `/api/tasks/:id` | Sửa một phần việc. |
| PATCH | `/api/tasks/:id/toggle` | Lật trạng thái `todo` ↔ `done`. |
| DELETE | `/api/tasks/:id` | Xoá việc. |
| GET | `/api/projects` | Danh sách dự án. |
| POST | `/api/projects` | Tạo dự án mới. |
| PATCH | `/api/projects/:id` | Sửa dự án. |
| DELETE | `/api/projects/:id` | Xoá dự án, việc bên trong được giữ lại. |

## GET /api/tasks

Trả về việc của người dùng đang đăng nhập.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `status` | `TaskStatus` | không | — | `todo` \| `done`. Bỏ trống = lấy cả hai. |
| `projectId` | chuỗi | không | — | Lọc theo dự án. `projectId=none` lấy việc chưa gán dự án. |
| `priority` | `TaskPriority` | không | — | `low` \| `medium` \| `high`. |
| `dueBefore` | ISO 8601 | không | — | Chỉ lấy việc có `dueAt` < giá trị này. Việc không có hạn bị loại. |
| `dueAfter` | ISO 8601 | không | — | Chỉ lấy việc có `dueAt` ≥ giá trị này. Kết hợp với `dueBefore` thành khoảng hạn — lịch tháng dùng cặp này. |
| `q` | chuỗi | không | — | Tìm trong `title` và `notes`. |
| `sort` | chuỗi | không | `-createdAt` | Cho phép: `createdAt`, `dueAt`, `priority`, `title`. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. |

Các bộ lọc kết hợp bằng `AND`.

**Response 200** — `GET /api/tasks?status=todo&projectId=prj_02`

```json
{
  "data": [
    {
      "id": "tsk_03",
      "title": "Nghiên cứu người dùng",
      "notes": "Phỏng vấn 5 người dùng hiện tại.",
      "status": "todo",
      "priority": "medium",
      "dueAt": "2026-07-16T16:00:00.000Z",
      "projectId": "prj_02",
      "createdAt": "2026-07-14T09:00:00.000Z",
      "completedAt": null
    },
    {
      "id": "tsk_05",
      "title": "Theo dõi chỉ số tăng trưởng",
      "notes": null,
      "status": "todo",
      "priority": "low",
      "dueAt": "2026-07-17T09:00:00.000Z",
      "projectId": "prj_02",
      "createdAt": "2026-07-15T09:00:00.000Z",
      "completedAt": null
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 2, "totalPages": 1 }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `status`/`priority` ngoài tập cho phép, `dueBefore` sai định dạng, `sort` ngoài danh sách. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/tasks

Tạo việc mới.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `title` | chuỗi | có | — | 1–200 ký tự, không rỗng sau trim. |
| `notes` | chuỗi \| null | không | `null` | Tối đa 2000 ký tự. |
| `status` | `TaskStatus` | không | `"todo"` | `todo` \| `done`. |
| `priority` | `TaskPriority` | không | `"medium"` | `low` \| `medium` \| `high`. |
| `dueAt` | ISO 8601 \| null | không | `null` | Hạn hoàn thành. |
| `projectId` | chuỗi \| null | không | `null` | Phải là dự án của chính người dùng. |

`completedAt` **không nhận từ client** — xem quy tắc 1. `createdAt` do server sinh.

```json
{
  "title": "Chuẩn bị nội dung workshop",
  "notes": "Slide + demo cho buổi Deep Work.",
  "priority": "high",
  "dueAt": "2026-07-23T18:00:00.000Z",
  "projectId": "prj_01"
}
```

**Response 201**

```json
{
  "data": {
    "id": "tsk_04",
    "title": "Chuẩn bị nội dung workshop",
    "notes": "Slide + demo cho buổi Deep Work.",
    "status": "todo",
    "priority": "high",
    "dueAt": "2026-07-23T18:00:00.000Z",
    "projectId": "prj_01",
    "createdAt": "2026-07-14T09:00:00.000Z",
    "completedAt": null
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `title`; `status`/`priority` ngoài tập cho phép; `dueAt` sai định dạng. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | `projectId` không tồn tại hoặc thuộc người khác. |

## GET /api/tasks/:id

Chi tiết một việc.

**Query params** — không có.

**Response 200**

```json
{
  "data": {
    "id": "tsk_01",
    "title": "Hoàn thành báo cáo tuần",
    "notes": null,
    "status": "done",
    "priority": "high",
    "dueAt": "2026-07-15T17:00:00.000Z",
    "projectId": "prj_01",
    "createdAt": "2026-07-13T09:00:00.000Z",
    "completedAt": "2026-07-15T11:20:00.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là việc của người khác. |

## PATCH /api/tasks/:id

Sửa một phần việc. Chỉ gửi trường muốn đổi. Gửi `null` cho `notes`/`dueAt`/
`projectId` là xoá giá trị.

**Request body** — mọi trường của `POST` đều tuỳ chọn. **Không gửi `completedAt`**
— server tự quản lý trường này theo `status` (quy tắc 1). Client gửi lên sẽ bị bỏ qua.

```json
{ "status": "done" }
```

**Response 200** — server tự điền `completedAt`:

```json
{
  "data": {
    "id": "tsk_03",
    "title": "Nghiên cứu người dùng",
    "notes": "Phỏng vấn 5 người dùng hiện tại.",
    "status": "done",
    "priority": "medium",
    "dueAt": "2026-07-16T16:00:00.000Z",
    "projectId": "prj_02",
    "createdAt": "2026-07-14T09:00:00.000Z",
    "completedAt": "2026-07-15T14:32:10.000Z"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Giá trị sai kiểu hoặc enum ngoài tập cho phép. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Việc không tồn tại/của người khác, **hoặc** `projectId` mới không thuộc người dùng. |

## PATCH /api/tasks/:id/toggle

Lật trạng thái việc: `todo` → `done` hoặc `done` → `todo`. Không có body.

Endpoint gộp này tồn tại vì checkbox trong danh sách là thao tác phổ biến nhất
của module, và nó tránh một lỗi thực tế: client đọc `status` cũ rồi gửi giá trị
ngược lại, nhưng nếu bản ghi đã đổi ở tab khác thì client ghi đè bằng dữ liệu cũ.
Toggle để server tự đọc trạng thái hiện tại và lật, nên không có khoảng trống
đọc–ghi. Client cũng không phải biết trạng thái hiện tại là gì mới bấm được.

Về mặt ngữ nghĩa nó tương đương `PATCH /api/tasks/:id` với `status` ngược lại,
kể cả hiệu ứng lên `completedAt` (quy tắc 1). Dùng `PATCH /api/tasks/:id` khi
muốn đặt trạng thái **cụ thể**, dùng `toggle` khi muốn **lật**.

**Query params** — không có. **Request body** — không có.

**Response 200** — `tsk_01` đang `done`, gọi toggle:

```json
{
  "data": {
    "id": "tsk_01",
    "title": "Hoàn thành báo cáo tuần",
    "notes": null,
    "status": "todo",
    "priority": "high",
    "dueAt": "2026-07-15T17:00:00.000Z",
    "projectId": "prj_01",
    "createdAt": "2026-07-13T09:00:00.000Z",
    "completedAt": null
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là việc của người khác. |

## DELETE /api/tasks/:id

Xoá vĩnh viễn một việc. Không hoàn tác được.

**Response 200**

```json
{ "data": { "id": "tsk_07", "deleted": true } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là việc của người khác. |

## GET /api/projects

Danh sách dự án của người dùng. Số lượng nhỏ (dùng để đổ bộ lọc và dropdown) nên
mặc định trả hết, không phân trang.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `sort` | chuỗi | không | `name` | Cho phép: `name`. |

**Response 200**

```json
{
  "data": [
    { "id": "prj_01", "name": "Công việc", "color": "brand" },
    { "id": "prj_02", "name": "Side Project", "color": "violet" },
    { "id": "prj_03", "name": "Cá nhân", "color": "sand" }
  ]
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/projects

Tạo dự án mới.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `name` | chuỗi | có | — | 1–100 ký tự, không rỗng sau trim. |
| `color` | `EventColor` | không | `"brand"` | `brand` \| `clay` \| `violet` \| `sage` \| `sand`. |

```json
{ "name": "Side Project", "color": "violet" }
```

**Response 201**

```json
{ "data": { "id": "prj_02", "name": "Side Project", "color": "violet" } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `name`, hoặc `color` ngoài tập `EventColor`. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## PATCH /api/projects/:id

Sửa tên hoặc màu dự án. Chỉ gửi trường muốn đổi.

**Request body** — `name`, `color`, cả hai tuỳ chọn.

```json
{ "color": "sage" }
```

**Response 200**

```json
{ "data": { "id": "prj_02", "name": "Side Project", "color": "sage" } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `name` rỗng, hoặc `color` ngoài tập cho phép. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là dự án của người khác. |

## DELETE /api/projects/:id

Xoá dự án. **Việc thuộc dự án KHÔNG bị xoá** — chúng ở lại và `projectId` trở
thành `null`, tức chuyển sang nhóm "chưa gán dự án". Đây là hành vi do schema
quy định (`onDelete: SetNull`), không phải do route handler tự làm.

**Response 200** — kèm số việc bị gỡ liên kết để client biết mà làm mới danh sách:

```json
{ "data": { "id": "prj_03", "deleted": true, "unlinkedTasks": 3 } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là dự án của người khác. |

Không có `409` ở đây: khác với `ExpenseCategory` (dùng `onDelete: Restrict`,
chặn xoá khi còn giao dịch), `Project` cho xoá thoải mái vì việc vẫn giữ được ý
nghĩa khi không còn dự án.

## Quy tắc nghiệp vụ

1. **`completedAt` do server quản lý, client không bao giờ gửi.** Khi `status`
   đổi sang `done` → server đặt `completedAt = now()`. Khi đổi ngược về `todo` →
   đặt `completedAt = null`. Nếu `status` trong body giống trạng thái hiện tại
   thì **không đụng vào** `completedAt` (sửa `title` của việc đã xong không được
   làm mới mốc hoàn thành). Áp dụng cho cả `POST` (tạo thẳng với `status: "done"`
   → `completedAt = now()`), `PATCH` và `toggle`.
2. **Bất biến:** `status = "done"` ⟺ `completedAt != null`. Không được tồn tại
   việc `done` mà `completedAt` null, hay việc `todo` mà `completedAt` khác null.
   Quy tắc 1 giữ bất biến này; đó cũng là lý do client không được ghi trực tiếp.
3. **`projectId` phải trỏ tới dự án của chính người dùng.** Kiểm tra quyền sở hữu
   dự án trước khi gán, nếu không người dùng có thể gán việc vào dự án người khác
   và dò được id hợp lệ. Sai → `404 NOT_FOUND` (không phải `403`, xem README).
4. **Xoá dự án không xoá việc** — `projectId` thành `null` (`onDelete: SetNull`).
5. **`status` và `priority` phải thuộc tập cố định**: `todo` | `done` và
   `low` | `medium` | `high`. SQLite lưu `String`, database không chặn — server
   phải kiểm tra.
6. **`color` của dự án dùng chung tập `EventColor`** với lịch và ghi chú:
   `brand` | `clay` | `violet` | `sage` | `sand`.
7. **`dueAt` được phép nằm trong quá khứ.** Việc quá hạn là trạng thái hợp lệ
   (xem `tsk_08`), không validate. UI tự tô màu cảnh báo.
8. Không có việc con, không có thứ tự thủ công — model `Task` không có trường nào
   cho hai thứ đó.

## Ghi chú khi hiện thực

- **Index có sẵn của `Task`:** `@@index([userId, status])` phục vụ bộ lọc phổ
  biến nhất (danh sách `todo`), `@@index([userId, dueAt])` phục vụ `dueBefore` và
  `sort=dueAt`, `@@index([projectId])` phục vụ đếm/gỡ liên kết khi xoá dự án.

  ```ts
  const tasks = await prisma.task.findMany({
    where: {
      userId: session.userId,
      ...(status && { status }),
      ...(projectId && { projectId: projectId === "none" ? null : projectId }),
      ...(priority && { priority }),
      ...(dueBefore && { dueAt: { lt: new Date(dueBefore) } }),
    },
    orderBy: { createdAt: "desc" },
  });
  ```

- **Không có index nào cho `priority`.** Lọc theo `priority` sẽ quét sau khi
  index thu hẹp theo `userId`. Ổn ở quy mô cá nhân; nếu cần, thêm
  `@@index([userId, priority])`.
- **`dueBefore` loại việc không có hạn:** `dueAt: { lt: ... }` trong Prisma tự
  loại `null` — đúng ý muốn ở đây (`tsk_07` không có hạn nên không bao giờ "sắp
  đến hạn"). Đừng "sửa" thành `OR: [{ dueAt: null }]`.
- **`projectId=none` là quy ước chuỗi, không phải id.** Phải map sang
  `projectId: null` trước khi đưa vào Prisma, nếu không sẽ đi tìm dự án tên
  "none" và trả về mảng rỗng.
- **Đặt logic `completedAt` vào một chỗ duy nhất**, ví dụ
  `resolveCompletedAt(current, next)`, rồi để cả `PATCH` và `toggle` gọi chung.
  Viết hai lần là hai lần có cơ hội lệch nhau.
- **`toggle` phải đọc–ghi nguyên tử.** Đọc `status` rồi `update` ở hai câu lệnh
  riêng là còn khoảng trống race. Bọc trong `prisma.$transaction`, và nhớ câu đọc
  cũng phải kèm `userId` trong `where`.
- **Xoá dự án:** `SetNull` do database lo, không cần tự `updateMany` trước. Nhưng
  nếu muốn trả `unlinkedTasks` thì đếm **trước** khi xoá — sau khi xoá thì
  `projectId` đã null, không đếm lại được nữa.
- **Lọc theo `userId` từ phiên**, không bao giờ từ body hay query. `PATCH`/
  `DELETE` dùng `updateMany`/`deleteMany` kèm `userId` trong `where`. Riêng
  `projectId` do client gửi phải kiểm tra sở hữu tách riêng — nó là id của bản ghi
  khác, `userId` trong `where` của `Task` không bảo vệ nó. Xem
  [README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).
- Response `Task` **không** trả `updatedAt` (có trong Prisma model, không có
  trong type). `Project` chỉ trả `id`, `name`, `color` — không có `userId`.
  Nhớ `select` đúng trường.
