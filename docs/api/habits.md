# Thói quen API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module quản lý thói quen hằng ngày và việc đánh dấu hoàn thành theo từng ngày.
Map tới model `Habit` và `HabitEntry` trong `prisma/schema.prisma`, khớp kiểu
`Habit` / `HabitEntry` trong `src/types/index.ts`.

Điểm khác biệt lớn nhất so với các module còn lại: `HabitEntry.date` là chuỗi
`"YYYY-MM-DD"`, không phải `DateTime`. Đọc kỹ phần quy tắc nghiệp vụ bên dưới
trước khi hiện thực — đây là chỗ dễ làm sai nhất.

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/habits` | Danh sách thói quen, kèm entries trong khoảng ngày. |
| POST | `/api/habits` | Tạo thói quen. |
| GET | `/api/habits/:id` | Chi tiết một thói quen. |
| PATCH | `/api/habits/:id` | Cập nhật thói quen, kể cả lưu trữ / bỏ lưu trữ. |
| DELETE | `/api/habits/:id` | Xoá thói quen và toàn bộ entries. |
| PUT | `/api/habits/:id/entries/:date` | Đánh dấu hoàn thành cho một ngày (upsert). |
| DELETE | `/api/habits/:id/entries/:date` | Xoá đánh dấu của một ngày. |

## GET /api/habits

Danh sách thói quen của người dùng đang đăng nhập, mỗi thói quen kèm mảng
`entries` trong khoảng ngày yêu cầu.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `from` | `YYYY-MM-DD` | không | 6 ngày trước hôm nay | Ngày đầu khoảng, bao gồm. |
| `to` | `YYYY-MM-DD` | không | hôm nay | Ngày cuối khoảng, bao gồm. |
| `includeArchived` | boolean | không | `false` | `true` thì trả cả thói quen đã lưu trữ. |

Mặc định `from`/`to` là cửa sổ 7 ngày kết thúc ở hôm nay — đúng cửa sổ giao diện
đang vẽ (`WINDOW_DAYS` trong `src/components/habits/habit-days.ts`).

Khoảng ngày bị chặn tối đa **366 ngày**. Không giới hạn thì
`?from=1970-01-01&to=2100-01-01` sẽ kéo về lượng entry vô nghĩa.

**Response 200**

```json
{
  "data": [
    {
      "id": "hab_01",
      "name": "Thiền 10 phút",
      "icon": "Flower2",
      "color": "brand",
      "targetPerWeek": 7,
      "createdAt": "2026-04-16T09:00:00.000Z",
      "entries": [
        { "id": "hen_hab_01_0", "habitId": "hab_01", "date": "2026-07-09", "done": true },
        { "id": "hen_hab_01_1", "habitId": "hab_01", "date": "2026-07-10", "done": true },
        { "id": "hen_hab_01_2", "habitId": "hab_01", "date": "2026-07-11", "done": true },
        { "id": "hen_hab_01_3", "habitId": "hab_01", "date": "2026-07-12", "done": true },
        { "id": "hen_hab_01_4", "habitId": "hab_01", "date": "2026-07-13", "done": true },
        { "id": "hen_hab_01_5", "habitId": "hab_01", "date": "2026-07-14", "done": true },
        { "id": "hen_hab_01_6", "habitId": "hab_01", "date": "2026-07-15", "done": false }
      ]
    },
    {
      "id": "hab_02",
      "name": "Đọc sách",
      "icon": "BookOpen",
      "color": "brand",
      "targetPerWeek": 7,
      "createdAt": "2026-03-17T09:00:00.000Z",
      "entries": [
        { "id": "hen_hab_02_0", "habitId": "hab_02", "date": "2026-07-09", "done": true },
        { "id": "hen_hab_02_1", "habitId": "hab_02", "date": "2026-07-10", "done": true },
        { "id": "hen_hab_02_2", "habitId": "hab_02", "date": "2026-07-11", "done": true },
        { "id": "hen_hab_02_3", "habitId": "hab_02", "date": "2026-07-12", "done": true },
        { "id": "hen_hab_02_4", "habitId": "hab_02", "date": "2026-07-13", "done": true },
        { "id": "hen_hab_02_5", "habitId": "hab_02", "date": "2026-07-14", "done": true },
        { "id": "hen_hab_02_6", "habitId": "hab_02", "date": "2026-07-15", "done": true }
      ]
    },
    {
      "id": "hab_03",
      "name": "Tập luyện",
      "icon": "Dumbbell",
      "color": "brand",
      "targetPerWeek": 7,
      "createdAt": "2026-05-16T09:00:00.000Z",
      "entries": [
        { "id": "hen_hab_03_0", "habitId": "hab_03", "date": "2026-07-09", "done": true },
        { "id": "hen_hab_03_1", "habitId": "hab_03", "date": "2026-07-10", "done": true },
        { "id": "hen_hab_03_2", "habitId": "hab_03", "date": "2026-07-11", "done": false },
        { "id": "hen_hab_03_3", "habitId": "hab_03", "date": "2026-07-12", "done": true },
        { "id": "hen_hab_03_4", "habitId": "hab_03", "date": "2026-07-13", "done": true },
        { "id": "hen_hab_03_5", "habitId": "hab_03", "date": "2026-07-14", "done": false },
        { "id": "hen_hab_03_6", "habitId": "hab_03", "date": "2026-07-15", "done": false }
      ]
    },
    {
      "id": "hab_04",
      "name": "Ngủ trước 23:00",
      "icon": "Moon",
      "color": "brand",
      "targetPerWeek": 7,
      "createdAt": "2026-05-31T09:00:00.000Z",
      "entries": [
        { "id": "hen_hab_04_0", "habitId": "hab_04", "date": "2026-07-09", "done": true },
        { "id": "hen_hab_04_1", "habitId": "hab_04", "date": "2026-07-10", "done": true },
        { "id": "hen_hab_04_2", "habitId": "hab_04", "date": "2026-07-11", "done": true },
        { "id": "hen_hab_04_3", "habitId": "hab_04", "date": "2026-07-12", "done": false },
        { "id": "hen_hab_04_4", "habitId": "hab_04", "date": "2026-07-13", "done": true },
        { "id": "hen_hab_04_5", "habitId": "hab_04", "date": "2026-07-14", "done": true },
        { "id": "hen_hab_04_6", "habitId": "hab_04", "date": "2026-07-15", "done": false }
      ]
    }
  ]
}
```

Với cửa sổ 7 ngày trên, số ngày hoàn thành lần lượt là 6/7, 7/7, 4/7 và 5/7 —
khớp `weeklyCount()` trong `src/lib/mock/habits.ts`.

`entries` lấy bằng `include` có `where` lọc khoảng ngày, không phải query riêng
cho từng thói quen (N+1). `entries` luôn sắp theo `date` tăng dần.

Endpoint này **không phân trang**: số thói quen mỗi người là hàng chục, và giao
diện cần cả danh sách để vẽ lưới. `entries` cũng không phân trang vì đã bị chặn
bởi khoảng ngày.

Ngày không có entry thì **không có phần tử tương ứng** trong mảng — không trả về
entry giả với `done: false`. Client tự coi ngày thiếu là chưa hoàn thành:

```ts
const map = new Map(habit.entries.map((e) => [e.date, e.done]));
const done = map.get(dayKey) ?? false;
```

Trả entry giả cho mọi ngày trong khoảng sẽ phình response vô ích và xoá mất sự
khác biệt giữa "chưa đánh dấu" và "đánh dấu là chưa làm".

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `from`/`to` sai dạng `YYYY-MM-DD`, hoặc `from` > `to`. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 422 | `UNPROCESSABLE` | Khoảng ngày vượt 366 ngày. |

## POST /api/habits

Tạo thói quen.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `name` | string | có | — | 1–100 ký tự. |
| `icon` | string | không | `Sprout` | Tên icon lucide-react, phải nằm trong danh sách cho phép. |
| `color` | `EventColor` | không | `brand` | `brand` \| `clay` \| `violet` \| `sage` \| `sand`. |
| `targetPerWeek` | số nguyên | không | `7` | 1–7. |

```json
{ "name": "Đọc sách", "icon": "BookOpen", "color": "brand", "targetPerWeek": 7 }
```

**Response 201** — thói quen vừa tạo, `entries` là mảng rỗng.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `name`, `icon` không thuộc danh sách cho phép, `color` sai, hoặc `targetPerWeek` ngoài 1–7. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## GET /api/habits/:id

Chi tiết một thói quen. Nhận cùng `from`/`to` như `GET /api/habits`.

Trả về cả khi thói quen đã lưu trữ — `includeArchived` chỉ ảnh hưởng tới danh
sách. Người dùng đang mở đích danh một thói quen thì phải thấy nó.

**Response 200** — một object `Habit` kèm `entries`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `from`/`to` sai dạng. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## PATCH /api/habits/:id

Cập nhật thói quen. Cũng là endpoint để lưu trữ / bỏ lưu trữ.

**Request body**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | string | không | 1–100 ký tự. |
| `icon` | string | không | Phải nằm trong danh sách icon cho phép. |
| `color` | `EventColor` | không | |
| `targetPerWeek` | số nguyên | không | 1–7. |
| `archivedAt` | ISO 8601 \| null | không | Thời điểm lưu trữ. `null` để bỏ lưu trữ. |

Lưu trữ:

```json
{ "archivedAt": "2026-07-15T09:00:00.000Z" }
```

Bỏ lưu trữ:

```json
{ "archivedAt": null }
```

`archivedAt` là `DateTime` (không phải `YYYY-MM-DD`): nó là dấu thời gian của một
hành động, khác hẳn `HabitEntry.date` là ngày theo lịch của người dùng.

**Response 200** — thói quen sau khi cập nhật.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Trường sai kiểu, `icon`/`color` không hợp lệ, hoặc `targetPerWeek` ngoài 1–7. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## DELETE /api/habits/:id

Xoá hẳn thói quen. Toàn bộ `HabitEntry` bị xoá theo — quan hệ khai báo
`onDelete: Cascade`.

Đây là thao tác **mất dữ liệu lịch sử**. Với người dùng muốn "ngừng theo dõi
nhưng giữ lịch sử", cách đúng là lưu trữ bằng `PATCH` với `archivedAt`, không
phải xoá. Client nên mời lưu trữ trước khi mời xoá.

**Response 204** — không có body.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## PUT /api/habits/:id/entries/:date

Đặt trạng thái hoàn thành của thói quen `:id` cho ngày `:date`. Đây là endpoint
được gọi mỗi lần người dùng bấm vào một chấm trong lưới.

**Tham số đường dẫn**

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `id` | string | ID thói quen. |
| `date` | `YYYY-MM-DD` | Ngày cần đánh dấu, ví dụ `2026-07-15`. |

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `done` | boolean | không | `true` | Trạng thái hoàn thành. |

```json
{ "done": true }
```

**Response 200**

```json
{
  "data": { "id": "hen_hab_01_6", "habitId": "hab_01", "date": "2026-07-15", "done": true }
}
```

Luôn trả `200`, kể cả lần gọi đầu tiên có tạo bản ghi mới. Không trả `201`: với
`PUT` idempotent, client không cần biết bản ghi đã tồn tại hay chưa, và phân biệt
200/201 chỉ tạo thêm nhánh xử lý vô ích.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `:date` sai dạng `YYYY-MM-DD` hoặc không phải ngày có thật (`2026-02-30`). |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Thói quen không tồn tại, hoặc thuộc người dùng khác. |
| 422 | `UNPROCESSABLE` | `:date` ở tương lai. |

**Không có `409`.** Gọi hai lần cùng một ngày là hợp lệ và phải cho kết quả giống
hệt — xem phần upsert bên dưới.

## DELETE /api/habits/:id/entries/:date

Xoá entry của một ngày, đưa ngày đó về trạng thái "chưa đánh dấu".

Khác với `PUT { "done": false }`: `PUT` ghi lại rằng "hôm đó không làm", còn
`DELETE` xoá hẳn dấu vết. Cả hai cùng hiển thị là chấm rỗng, nhưng `DELETE` dùng
cho trường hợp người dùng bấm nhầm.

**Response 204** — không có body. Trả `204` cả khi entry không tồn tại: `DELETE`
là idempotent, và mục đích của client ("ngày này không có entry") đã đạt.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `:date` sai dạng `YYYY-MM-DD`. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Thói quen không tồn tại, hoặc thuộc người dùng khác. |

## Quy tắc nghiệp vụ

### `HabitEntry.date` là `String "YYYY-MM-DD"`, không phải `DateTime`

**Đây là điểm dễ làm sai nhất của module này.** Cột `date` khai báo `String`
trong schema và là ngoại lệ duy nhất của quy ước "ngày giờ luôn là ISO 8601 kèm
múi giờ" trong README.

Lý do: thứ có ý nghĩa ở đây là **"hôm nay" theo lịch của người dùng**, không phải
một mốc trên trục thời gian. Người dùng ở Việt Nam thiền lúc 23:30 ngày 15/7 thì
đó là thói quen của **ngày 15/7**. Nếu lưu `DateTime`, giá trị vào database là
`2026-07-15T16:30:00Z` — và mọi phép đọc sau đó phải chuyển về UTC+7 mới ra lại
được ngày 15. Chỉ cần một chỗ quên chuyển, chấm nhảy sang ngày 16 và chuỗi ngày
liên tiếp của người dùng bị gãy làm đôi.

Cách hỏng cụ thể khi dùng `DateTime`:

- Server chạy UTC, người dùng ở UTC+7: mọi lần đánh dấu sau 17:00 giờ Việt Nam bị
  ghi sang ngày hôm sau.
- `new Date("2026-07-15")` trong JavaScript được hiểu là **nửa đêm UTC**, hiển
  thị ở UTC−5 thành ngày 14/7. Cùng một chuỗi, hai ngày khác nhau.
- Người dùng đi công tác đổi múi giờ: lịch sử đã ghi bỗng dịch chuyển, dù không
  ai sửa gì.

Với `String`, `"2026-07-15"` là `"2026-07-15"` ở mọi máy, mọi múi giờ, mọi lần
đọc. Không có phép chuyển đổi nào để làm sai.

Hệ quả kéo theo:

- **So sánh khoảng ngày dùng so sánh chuỗi.** Định dạng `YYYY-MM-DD` có thứ tự
  từ điển trùng với thứ tự thời gian, nên `WHERE date >= '2026-07-09' AND date <= '2026-07-15'`
  chạy đúng và dùng được index.

  ```ts
  const entries = await prisma.habitEntry.findMany({
    where: { habitId, date: { gte: from, lte: to } }, // from/to là string
    orderBy: { date: "asc" },
  });
  ```

  Đây là lý do bắt buộc đệm số 0 (`2026-07-09`, không phải `2026-7-9`): thiếu
  đệm thì `"2026-07-9" > "2026-07-15"` theo thứ tự chuỗi, và mọi truy vấn khoảng
  ngày sai âm thầm.
- **Server phải validate `:date` chặt.** Cột `String` nhận mọi thứ, kể cả
  `"hôm nay"` hay `"2026-02-30"`. Kiểm tra bằng regex `^\d{4}-\d{2}-\d{2}$`
  **và** kiểm tra ngày có thật (tháng 2 không có ngày 30). Một giá trị rác lọt
  vào là hỏng vĩnh viễn thứ tự của mọi truy vấn khoảng ngày.
- **"Hôm nay" tính theo múi giờ người dùng**, không phải theo `new Date()` của
  server. Nếu server chạy UTC thì "hôm nay" của nó lệch với "hôm nay" của người
  dùng suốt 7 tiếng mỗi ngày. Client gửi lên `:date` mà nó đang hiển thị; server
  không tự suy ra ngày.

`Habit.createdAt` và `Habit.archivedAt` vẫn là `DateTime` bình thường — chúng là
mốc thời gian của hành động, không phải ngày theo lịch.

### Mỗi thói quen tối đa một entry mỗi ngày — dùng upsert

Schema có `@@unique([habitId, date])`. Ràng buộc này là tuyến phòng thủ cuối:
hai entry cho cùng một ngày sẽ làm chuỗi ngày và tỉ lệ hoàn thành đếm sai, và
không có cách nào biết entry nào đúng.

`PUT /api/habits/:id/entries/:date` phải dùng **upsert**, không phải `create`:

```ts
// ĐÚNG — gọi bao nhiêu lần cũng ra cùng một kết quả.
const entry = await prisma.habitEntry.upsert({
  where: { habitId_date: { habitId: params.id, date: params.date } },
  create: { habitId: params.id, date: params.date, done },
  update: { done },
});

// SAI — lần gọi thứ hai ném lỗi ràng buộc duy nhất (P2002).
await prisma.habitEntry.create({
  data: { habitId: params.id, date: params.date, done },
});
```

`create` hỏng ngay ở luồng dùng bình thường nhất: người dùng bấm chấm, mạng chậm,
bấm lại. Lần thứ hai trả lỗi trong khi lẽ ra chẳng có gì sai. Chưa kể client phải
tự biết ngày đó đã có entry chưa để chọn giữa `create` và `update` — tức là phải
`GET` trước mỗi lần bấm, thêm một vòng mạng và một khe hở tranh chấp.

Yêu cầu rõ ràng: **gọi `PUT` hai lần với cùng `habitId` + `date` + `done` phải
idempotent** — không tạo bản ghi trùng, không trả `409`, kết quả lần hai giống
hệt lần một. Đó cũng là lý do method là `PUT` chứ không phải `POST`.

Đây cũng là lý do tên `where` của Prisma là `habitId_date` — Prisma sinh khoá
ghép này từ `@@unique([habitId, date])`.

### `Habit.icon` phải nằm trong danh sách cho phép

`icon` là `String` chứa tên component lucide-react, ví dụ `"BookOpen"`. Server
**không được nhận chuỗi tuỳ ý** — phải đối chiếu với một danh sách cố định.

Lý do: client không import động icon theo tên khi bundle được, nên
`src/components/habits/habit-days.ts` map tường minh:

```ts
const iconMap: Record<string, LucideIcon> = { Flower2, BookOpen, Dumbbell, Moon };
export function habitIcon(name: string): LucideIcon {
  return iconMap[name] ?? Sprout;
}
```

Tên nào không có trong map sẽ lặng lẽ rơi về `Sprout`. Người dùng lưu icon
`"Rocket"`, tải lại trang và thấy cây mầm — không có thông báo lỗi, không có
cách nào hiểu chuyện gì đã xảy ra. Chặn ở tầng ghi bằng `400 VALIDATION_FAILED`
thì người dùng biết ngay là icon đó không dùng được.

Danh sách cho phép hiện tại, lấy từ `iconMap` cộng giá trị mặc định của schema:

```
Flower2 | BookOpen | Dumbbell | Moon | Sprout
```

Đây phải là **một nguồn duy nhất**: tách hằng số ra một file dùng chung cho cả
client và validation ở server. Hai danh sách chép tay ở hai nơi sẽ lệch nhau ngay
lần thêm icon tiếp theo. Thêm icon mới = thêm vào `iconMap` **và** import
component tương ứng, không chỉ nới danh sách ở server.

Fallback `?? Sprout` ở client vẫn giữ, để dữ liệu cũ có icon lạ không làm vỡ
giao diện.

### Thói quen đã lưu trữ mặc định không trả về

`Habit.archivedAt` là `DateTime?`. `null` = đang theo dõi, có giá trị = đã lưu
trữ.

`GET /api/habits` mặc định lọc `archivedAt: null`. Thêm `?includeArchived=true`
để lấy cả hai loại:

```ts
const where = {
  userId: session.userId,
  ...(includeArchived ? {} : { archivedAt: null }),
};
```

Lưu trữ là "xoá mềm có chủ đích": người dùng ngừng theo dõi một thói quen nhưng
lịch sử vẫn còn nguyên, và bỏ lưu trữ lấy lại được toàn bộ. Nếu mặc định trả cả
thói quen đã lưu trữ, lưới hoàn thành sẽ đầy những dòng người dùng đã chủ động
dẹp đi.

`includeArchived=true` **không** lọc ngược (không có chế độ "chỉ lấy đã lưu
trữ"). Client cần danh sách lưu trữ riêng thì tự lọc `archivedAt !== null` trên
kết quả — số thói quen mỗi người vốn nhỏ.

Lưu trữ **không** xoá entries, và `targetPerWeek` vẫn giữ nguyên để bỏ lưu trữ là
quay lại đúng trạng thái cũ.

### `targetPerWeek` trong khoảng 1–7

Số ngày cần hoàn thành mỗi tuần. Lớn hơn 7 là vô nghĩa (tuần chỉ có 7 ngày) và
làm tỉ lệ hoàn thành vượt 100%. Bằng 0 nghĩa là không cần làm gì. Ngoài khoảng →
`400 VALIDATION_FAILED`.

Trong mock, cả bốn thói quen đều đặt `targetPerWeek: 7`; các con số 6/7, 4/7,
5/7 hiển thị ở giao diện là **số ngày đã hoàn thành thực tế**, không phải mục
tiêu.

## Ghi chú khi hiện thực

1. Route handler: `src/app/api/habits/route.ts`,
   `src/app/api/habits/[id]/route.ts`,
   `src/app/api/habits/[id]/entries/[date]/route.ts`.
2. **`HabitEntry` không có cột `userId`.** Quyền sở hữu đi qua `Habit`. Mọi thao
   tác trên entry phải xác minh thói quen cha thuộc về người đang đăng nhập
   **trước khi** upsert:

   ```ts
   const habit = await prisma.habit.findFirst({
     where: { id: params.id, userId: session.userId },
   });
   if (!habit) return notFound();
   // giờ mới upsert
   ```

   `upsert` với `where: { habitId_date: ... }` **không** kiểm tra được `userId`
   vì khoá ghép chỉ gồm `habitId` và `date`. Bỏ bước kiểm tra ở trên là cho phép
   bất kỳ ai ghi entry vào thói quen của người khác khi biết id. Đây là chỗ dễ
   sai nhất về bảo mật trong module này.
3. Lấy entries theo khoảng ngày bằng `include` có `where`, để không N+1:

   ```ts
   const habits = await prisma.habit.findMany({
     where,
     include: {
       entries: { where: { date: { gte: from, lte: to } }, orderBy: { date: "asc" } },
     },
   });
   ```
4. `@@index([habitId])` phục vụ truy vấn entries theo thói quen. `@@unique([habitId, date])`
   cũng tạo index, nên tra một entry theo `(habitId, date)` không phải quét bảng.
   Lọc `archivedAt: null` không có index riêng — số thói quen mỗi người nhỏ, quét
   sau khi lọc `userId` là đủ.
5. Giao diện hiện đọc `habits` và `habitEntries` từ `src/lib/mock/habits.ts`, còn
   `weeklyCount()` / `weekStreak()` đọc thẳng `weekPattern` — một hằng số chỉ có
   trong mock. Khi nối API, hai hàm đó phải tính lại từ `habit.entries` (đếm
   `done === true` trong cửa sổ 7 ngày của `habitDays`), không có sẵn ở response.
   Đây là phần sửa ở client nhiều nhất của module.
6. Kiểu `Habit` trong `src/types/index.ts` hiện **không** có trường `entries` và
   `archivedAt`, trong khi response của `GET /api/habits` trả kèm cả hai. Khi nối
   API, cần thêm `archivedAt: string | null` vào `Habit` và một kiểu
   `HabitWithEntries = Habit & { entries: HabitEntry[] }` cho response — đừng để
   kiểu và response lệch nhau.
