# Lịch API

> **Trạng thái: ĐÃ HIỆN THỰC** — route handler trong `src/app/api/events*`,
> validate/mapper dùng chung trong `src/lib/api/events.ts`. Giao diện
> `/calendar` chạy trên dữ liệu thật: tải theo khoảng lưới đang xem, tạo/sửa
> qua dialog, xoá có xác nhận. Xem [README.md](README.md) cho quy ước chung.

Module này quản lý sự kiện trên lịch của người dùng: tạo, sửa, xoá và truy vấn
theo khoảng ngày. Map tới model `CalendarEvent` trong `prisma/schema.prisma`,
shape response khớp `CalendarEvent` trong `src/types/index.ts`.

Các ví dụ bên dưới lấy từ `src/lib/mock/calendar.ts`, neo vào ngày
`2026-07-15` (mock sinh ngày tương đối so với "hôm nay").

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/events` | Danh sách sự kiện, lọc theo khoảng ngày. |
| POST | `/api/events` | Tạo sự kiện mới. |
| GET | `/api/events/:id` | Chi tiết một sự kiện. |
| PATCH | `/api/events/:id` | Sửa một phần sự kiện. |
| DELETE | `/api/events/:id` | Xoá sự kiện. |

## GET /api/events

Trả về sự kiện của người dùng đang đăng nhập. Giao diện lịch tháng luôn gọi kèm
`from`/`to` để chỉ tải đúng tháng đang xem.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `from` | ISO 8601 | không | — | Chỉ lấy sự kiện có `startsAt` ≥ giá trị này. |
| `to` | ISO 8601 | không | — | Chỉ lấy sự kiện có `startsAt` ≤ giá trị này. |
| `q` | chuỗi | không | — | Tìm trong `title` và `description`. |
| `sort` | chuỗi | không | `startsAt` | Cho phép: `startsAt`, `title`. Thêm `-` để giảm dần. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. Lịch tháng nên gửi `perPage=100`. |

`from` và `to` độc lập nhau: gửi một trong hai cũng hợp lệ. Nếu gửi cả hai mà
`to` < `from` → `422`.

**Response 200** — `GET /api/events?from=2026-07-15T00:00:00.000Z&to=2026-07-16T00:00:00.000Z`

```json
{
  "data": [
    {
      "id": "evt_01",
      "title": "Viết kế hoạch Q2",
      "description": "Phác thảo mục tiêu và ngân sách cho quý tới.",
      "startsAt": "2026-07-15T09:00:00.000Z",
      "endsAt": "2026-07-15T10:30:00.000Z",
      "allDay": false,
      "location": "Bàn làm việc",
      "color": "brand"
    },
    {
      "id": "evt_02",
      "title": "Họp đội ngũ",
      "description": "Điểm lại tiến độ sprint và chốt việc tuần sau.",
      "startsAt": "2026-07-15T14:00:00.000Z",
      "endsAt": "2026-07-15T15:00:00.000Z",
      "allDay": false,
      "location": "Google Meet",
      "color": "clay"
    },
    {
      "id": "evt_03",
      "title": "Đọc sách",
      "description": "Atomic Habits — chương 3.",
      "startsAt": "2026-07-15T19:30:00.000Z",
      "endsAt": "2026-07-15T20:30:00.000Z",
      "allDay": false,
      "location": null,
      "color": "violet"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 3, "totalPages": 1 }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `from`/`to` không phải ISO 8601, `sort` ngoài danh sách cho phép, `page`/`perPage` không phải số. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 422 | `UNPROCESSABLE` | `to` sớm hơn `from`. |

## POST /api/events

Tạo sự kiện mới cho người dùng đang đăng nhập.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `title` | chuỗi | có | — | 1–200 ký tự, không được rỗng sau khi trim. |
| `description` | chuỗi \| null | không | `null` | Tối đa 2000 ký tự. |
| `startsAt` | ISO 8601 | có | — | Thời điểm bắt đầu. |
| `endsAt` | ISO 8601 | có | — | Phải sau `startsAt`. |
| `allDay` | boolean | không | `false` | Xem quy tắc 3. |
| `location` | chuỗi \| null | không | `null` | Tối đa 200 ký tự. |
| `color` | `EventColor` | không | `"brand"` | `brand` \| `clay` \| `violet` \| `sage` \| `sand`. |

`id` do server sinh (cuid). `userId` lấy từ phiên — client gửi lên cũng bị bỏ qua.

```json
{
  "title": "Chạy bộ cùng nhóm",
  "description": null,
  "startsAt": "2026-07-18T06:00:00.000Z",
  "endsAt": "2026-07-18T07:00:00.000Z",
  "allDay": false,
  "location": "Công viên Thống Nhất",
  "color": "sage"
}
```

**Response 201**

```json
{
  "data": {
    "id": "evt_07",
    "title": "Chạy bộ cùng nhóm",
    "description": null,
    "startsAt": "2026-07-18T06:00:00.000Z",
    "endsAt": "2026-07-18T07:00:00.000Z",
    "allDay": false,
    "location": "Công viên Thống Nhất",
    "color": "sage"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `title`/`startsAt`/`endsAt`, `color` ngoài tập `EventColor`, ngày sai định dạng. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 422 | `UNPROCESSABLE` | `endsAt` không sau `startsAt`. |

## GET /api/events/:id

Chi tiết một sự kiện.

**Query params** — không có.

**Response 200**

```json
{
  "data": {
    "id": "evt_06",
    "title": "Sinh nhật mẹ",
    "description": "Đặt hoa từ hôm trước.",
    "startsAt": "2026-07-27T00:00:00.000Z",
    "endsAt": "2026-07-27T23:59:00.000Z",
    "allDay": true,
    "location": null,
    "color": "sand"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là sự kiện của người khác. |

## PATCH /api/events/:id

Sửa một phần sự kiện. Chỉ gửi trường muốn đổi — trường vắng mặt giữ nguyên.
Gửi `null` cho `description`/`location` là xoá giá trị.

**Request body** — mọi trường của `POST` đều tuỳ chọn.

```json
{
  "startsAt": "2026-07-24T15:00:00.000Z",
  "endsAt": "2026-07-24T17:00:00.000Z",
  "location": "Phòng họp lớn"
}
```

**Response 200**

```json
{
  "data": {
    "id": "evt_05",
    "title": "Workshop nội bộ: Deep Work",
    "description": "Chuẩn bị slide trước một ngày.",
    "startsAt": "2026-07-24T15:00:00.000Z",
    "endsAt": "2026-07-24T17:00:00.000Z",
    "allDay": false,
    "location": "Phòng họp lớn",
    "color": "violet"
  }
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Giá trị sai kiểu hoặc `color` ngoài tập cho phép. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là sự kiện của người khác. |
| 422 | `UNPROCESSABLE` | Sau khi ghép thay đổi, `endsAt` không sau `startsAt`. |

## DELETE /api/events/:id

Xoá vĩnh viễn một sự kiện. Không có thùng rác, không hoàn tác được.

**Response 200**

```json
{ "data": { "id": "evt_09", "deleted": true } }
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc là sự kiện của người khác. |

## Quy tắc nghiệp vụ

1. **`endsAt` phải sau `startsAt`.** Bằng nhau cũng không hợp lệ. Vi phạm →
   `422 UNPROCESSABLE`, không phải `400`: dữ liệu đúng định dạng, chỉ sai nghiệp
   vụ. Với `PATCH`, kiểm tra trên giá trị **sau khi ghép** với bản ghi hiện tại —
   client có thể chỉ gửi mỗi `endsAt`.
2. **`color` phải thuộc `EventColor`**: `brand` | `clay` | `violet` | `sage` |
   `sand`. SQLite lưu cột này dạng `String` nên database không chặn giá trị sai —
   server bắt buộc kiểm tra. Giá trị ngoài tập → `400 VALIDATION_FAILED`.
3. **`allDay = true` thì phần giờ bị bỏ qua.** Sự kiện vẫn lưu đủ `startsAt` và
   `endsAt` dạng DateTime, nhưng UI chỉ đọc phần ngày. Quy ước lưu: chuẩn hoá
   `startsAt` về đầu ngày và `endsAt` về cuối ngày (xem `evt_06`:
   `00:00:00` → `23:59:00`). Client gửi giờ gì cũng được, server tự chuẩn hoá.
4. **Sự kiện cả ngày vẫn phải qua quy tắc 1.** Sau khi chuẩn hoá, sự kiện một
   ngày vẫn có `endsAt` > `startsAt`.
5. Sự kiện luôn thuộc đúng một người dùng. Không có chia sẻ, không có mời tham
   dự — model `CalendarEvent` không có quan hệ nào ngoài `user`.
6. Không có lặp lại (recurring). Sinh nhật hằng năm hiện là sự kiện đơn lẻ.

## Ghi chú khi hiện thực

- **Index `@@index([userId, startsAt])`** được thiết kế đúng cho truy vấn chính
  của module này: lọc `userId` bằng, rồi quét khoảng `startsAt`. Cột đầu là điều
  kiện bằng, cột sau là điều kiện khoảng — đúng thứ tự để index dùng được cả hai.
  Sắp xếp theo `startsAt` cũng miễn phí luôn vì index đã sẵn thứ tự.

  ```ts
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: session.userId,
      startsAt: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: { startsAt: "asc" },
  });
  ```

- **Đừng thêm điều kiện bằng nào trước `startsAt`** trong `where` mà kỳ vọng
  index vẫn dùng được — ví dụ lọc thêm `color` sẽ phải quét sau. Với quy mô dữ
  liệu cá nhân thì không đáng lo, nhưng biết để không nhầm.
- **Cạm bẫy khoảng ngày:** lọc theo `startsAt` nghĩa là sự kiện **bắt đầu trước
  `from` nhưng kéo dài sang trong khoảng** sẽ không xuất hiện. Với dữ liệu hiện
  tại (mọi sự kiện gọn trong một ngày) thì không thành vấn đề. Nếu sau này có sự
  kiện nhiều ngày, đổi điều kiện thành giao khoảng: `startsAt <= to AND endsAt >= from`
   — nhưng lúc đó index trên `startsAt` chỉ còn dùng được một nửa.
- **Múi giờ:** `from`/`to` do client tính từ tháng đang xem, gửi lên dạng ISO có
  múi giờ. Server chỉ `new Date()` rồi so sánh, không tự suy diễn múi giờ. Ranh
  giới tháng là việc của client.
- **Chuẩn hoá `allDay` trước khi validate quy tắc 1**, không phải sau — nếu không
  sự kiện cả ngày do client gửi `startsAt` = `endsAt` = giữa trưa sẽ bị `422` oan.
- **Lọc theo `userId` từ phiên**, không bao giờ từ query param. `PATCH`/`DELETE`
  dùng `updateMany`/`deleteMany` kèm `userId` trong `where`, rồi kiểm tra `count`
  để trả `404`. Xem [README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).
- Response **không** trả `createdAt`/`updatedAt`: hai cột này có trong Prisma
  model nhưng không có trong type `CalendarEvent`. Nhớ `select` đúng trường.
