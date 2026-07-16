# API — Quy ước chung

> **Trạng thái: chưa hiện thực.** Đây là bản đặc tả cho giai đoạn tiếp theo.
> Giao diện hiện đọc dữ liệu mẫu từ `src/lib/mock/`. Tài liệu này là hợp đồng
> mà tầng API phải tuân theo khi được xây — shape dữ liệu đã khớp sẵn với
> `src/types/index.ts` và `prisma/schema.prisma`.

Đọc trang này trước, rồi mới tới tài liệu từng module. Mọi endpoint đều tuân
theo các quy ước ở đây, nên các trang sau sẽ không lặp lại chúng.

## Mục lục

| Module | Tài liệu | Route |
|---|---|---|
| Xác thực | [auth.md](auth.md) | `/api/auth/*` |
| Lịch | [calendar.md](calendar.md) | `/api/events` |
| Công việc | [tasks.md](tasks.md) | `/api/tasks`, `/api/projects` |
| Ghi chú | [notes.md](notes.md) | `/api/notes` |
| Mục tiêu | [goals.md](goals.md) | `/api/goals` |
| Chi tiêu | [expenses.md](expenses.md) | `/api/expenses`, `/api/expense-categories` |
| Thói quen | [habits.md](habits.md) | `/api/habits` |
| Email | [email.md](email.md) | `/api/emails` |
| Tài liệu | [documents.md](documents.md) | `/api/documents`, `/api/document-folders` |
| Second Brain | [second-brain.md](second-brain.md) | `/api/captures`, `/api/graph` |
| Tìm kiếm | [search.md](search.md) | `/api/search` |

## Địa chỉ gốc

```
/api
```

Toàn bộ API nằm chung dự án Next.js, hiện thực bằng Route Handler trong
`src/app/api/`. Không có API bên ngoài.

## Định dạng dữ liệu

- Request và response đều là `application/json`.
- Ngày giờ luôn là chuỗi **ISO 8601 kèm múi giờ**: `2026-07-15T09:00:00.000Z`.
  - Ngoại lệ: `HabitEntry.date` dùng `YYYY-MM-DD` (không giờ, không múi giờ) vì
    "hôm nay" của người dùng mới là thứ có ý nghĩa, không phải mốc UTC.
- Tiền luôn là **số nguyên, đơn vị đồng**. Không dùng số thực — `0.1 + 0.2` sẽ
  không bằng `0.3` và sai số sẽ tích luỹ khi cộng dồn.
- Kích thước file luôn là **số nguyên, đơn vị byte**.

## Bọc response

**Thành công** — dữ liệu luôn nằm trong khoá `data`:

```json
{ "data": { "id": "tsk_01", "title": "Nghiên cứu người dùng" } }
```

Với danh sách có phân trang, thêm khoá `meta`:

```json
{
  "data": [{ "id": "tsk_01" }, { "id": "tsk_02" }],
  "meta": { "page": 1, "perPage": 20, "total": 47, "totalPages": 3 }
}
```

**Lỗi** — luôn nằm trong khoá `error`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Dữ liệu không hợp lệ.",
    "fields": { "title": "Vui lòng nhập tiêu đề." }
  }
}
```

Kiểu TypeScript tương ứng: `ApiSuccess<T>` và `ApiError` trong
`src/types/index.ts`.

Lý do bọc thay vì trả thẳng mảng: response có thể thêm `meta` sau này mà không
phá vỡ client, và client chỉ cần một hàm duy nhất để phân biệt thành công/lỗi.

## Mã lỗi

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Dữ liệu gửi lên không hợp lệ. Kèm `fields`. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập hoặc phiên đã hết hạn. |
| 403 | `FORBIDDEN` | Đã đăng nhập nhưng không có quyền với tài nguyên này. |
| 404 | `NOT_FOUND` | Không tồn tại, **hoặc** tồn tại nhưng thuộc người khác. |
| 409 | `CONFLICT` | Vi phạm ràng buộc duy nhất, ví dụ email đã đăng ký. |
| 422 | `UNPROCESSABLE` | Đúng định dạng nhưng vi phạm quy tắc nghiệp vụ. |
| 429 | `RATE_LIMITED` | Vượt giới hạn tần suất. Kèm header `Retry-After`. |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước. Không lộ chi tiết ra ngoài. |

**Vì sao 404 thay vì 403 cho tài nguyên của người khác:** trả 403 là gián tiếp
xác nhận "id này có tồn tại", cho phép dò id hợp lệ. Trả 404 thì kẻ tấn công
không phân biệt được "không tồn tại" và "không phải của bạn".

## Xác thực

Mọi endpoint **trừ** `/api/auth/register`, `/api/auth/login`,
`/api/auth/forgot-password` và `/api/auth/reset-password` đều yêu cầu đăng nhập.

Phiên đăng nhập dùng cookie:

```
Set-Cookie: luma_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000
```

- `HttpOnly` — JavaScript không đọc được cookie, nên XSS không lấy được token.
- `SameSite=Lax` — chặn CSRF cho request thay đổi dữ liệu từ trang khác.
- `Secure` — chỉ gửi qua HTTPS. Ở môi trường dev trên `localhost` thì bỏ cờ này.

Database chỉ lưu **SHA-256 của token**, không lưu token thô (xem model `Session`
trong `prisma/schema.prisma`). Nếu database bị rò rỉ, kẻ tấn công vẫn không mạo
danh được phiên nào.

Chi tiết: [auth.md](auth.md).

## Phân tách dữ liệu theo người dùng

**Đây là quy tắc quan trọng nhất của toàn bộ API.**

Mọi truy vấn phải lọc theo `userId` lấy từ phiên đăng nhập, **không bao giờ** lấy
từ tham số client gửi lên:

```ts
// ĐÚNG — userId đến từ phiên, client không can thiệp được.
const session = await requireSession(request);
const task = await prisma.task.findFirst({
  where: { id: params.id, userId: session.userId },
});
if (!task) return notFound(); // Không tồn tại hoặc không phải của bạn.

// SAI — client tự khai userId là ai cũng được, đọc được dữ liệu người khác.
const task = await prisma.task.findUnique({ where: { id: params.id } });
```

Áp dụng cho cả `PATCH` và `DELETE`: luôn dùng `updateMany`/`deleteMany` có kèm
`userId` trong `where`, hoặc kiểm tra quyền sở hữu trước khi thao tác.

## Phân trang

Dùng cho mọi endpoint danh sách:

| Tham số | Kiểu | Mặc định | Giới hạn |
|---|---|---|---|
| `page` | số nguyên | `1` | ≥ 1 |
| `perPage` | số nguyên | `20` | 1–100 |

`perPage` bị kẹp cứng ở 100 tại server. Không tin giá trị client gửi lên —
`perPage=1000000` sẽ làm sập bộ nhớ.

## Sắp xếp và lọc

- `sort` — tên trường, thêm `-` ở đầu để giảm dần: `sort=-createdAt`.
  Server chỉ chấp nhận danh sách trường cho phép cố định, không truyền thẳng
  chuỗi từ client vào Prisma.
- `q` — tìm kiếm toàn văn trong module đó.
- Các bộ lọc riêng được ghi trong tài liệu từng module.

## Kiểm tra dữ liệu

Client đã kiểm tra ở `src/lib/validation.ts`, nhưng **server phải kiểm tra lại
toàn bộ**. Validation phía client chỉ để phản hồi nhanh cho người dùng; ai cũng
có thể gọi thẳng API bằng `curl`.

Enum (`status`, `priority`, `color`, `type`…) lưu dạng `String` trong SQLite nên
database không tự chặn giá trị sai — server bắt buộc phải kiểm tra chúng nằm
trong tập giá trị hợp lệ.

## Giới hạn tần suất

| Nhóm | Giới hạn |
|---|---|
| `/api/auth/login`, `/api/auth/register` | 5 request / 15 phút / IP |
| `/api/auth/forgot-password` | 3 request / giờ / email |
| Còn lại | 100 request / phút / người dùng |

Vượt giới hạn → `429` kèm header `Retry-After` (số giây).

## Ghi chú khi hiện thực

Tầng API chưa được viết. Khi bắt tay vào làm:

1. Tạo `src/lib/api/` chứa các helper dùng chung: `requireSession()`,
   `json()`, `error()`, `parsePagination()` — để mỗi route handler không phải
   lặp lại.
2. Route handler đặt tại `src/app/api/<module>/route.ts` và
   `src/app/api/<module>/[id]/route.ts`.
3. Thay từng import `@/lib/mock` trong component bằng lời gọi fetch. Vì shape
   dữ liệu giống hệt nhau, component gần như không phải sửa.
4. Xoá `src/lib/mock/` khi không còn chỗ nào import — trừ khi giữ lại để seed.
