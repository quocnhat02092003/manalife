# Tài liệu manalife

## Bắt đầu từ đâu

| Bạn muốn…                       | Đọc                                                               |
| ------------------------------- | ----------------------------------------------------------------- |
| Chạy dự án lên                  | [../README.md](../README.md)                                      |
| Hiểu cách mọi thứ ghép với nhau | [architecture.md](architecture.md)                                |
| Sửa hoặc thêm giao diện         | [ui-guidelines.md](ui-guidelines.md) ← **đọc trước khi viết CSS** |
| Hiểu dữ liệu và quan hệ         | [data-model.md](data-model.md)                                    |
| Xây tầng API                    | [api/README.md](api/README.md) ← **đọc trước**                    |

## Tài liệu API

Đọc [api/README.md](api/README.md) trước — nó chứa quy ước chung (bọc response,
mã lỗi, xác thực, phân trang, phân tách dữ liệu theo người dùng) mà các trang sau
không lặp lại.

| Module       | Tài liệu                                   |
| ------------ | ------------------------------------------ |
| Xác thực     | [api/auth.md](api/auth.md)                 |
| Lịch         | [api/calendar.md](api/calendar.md)         |
| Công việc    | [api/tasks.md](api/tasks.md)               |
| Ghi chú      | [api/notes.md](api/notes.md)               |
| Mục tiêu     | [api/goals.md](api/goals.md)               |
| Chi tiêu     | [api/expenses.md](api/expenses.md)         |
| Thói quen    | [api/habits.md](api/habits.md)             |
| Email        | [api/email.md](api/email.md)               |
| Tài liệu     | [api/documents.md](api/documents.md)       |
| Second Brain | [api/second-brain.md](api/second-brain.md) |
| Tìm kiếm     | [api/search.md](api/search.md)             |

## Trạng thái

**Giai đoạn 1 — Giao diện: xong.** Chín module chạy được trên dữ liệu mẫu.

**Giai đoạn 2 — API: chưa làm.** Toàn bộ thư mục `api/` là đặc tả cho việc sắp
làm, không phải mô tả thứ đang chạy. Mỗi file đều mở đầu bằng ghi chú trạng thái.

Nền đã sẵn: schema Prisma đã migrate được, kiểu dữ liệu đã khớp, đặc tả đã viết.
Xem [architecture.md](architecture.md#thứ-tự-nên-làm-giai-đoạn-2) để biết thứ tự
nên làm.

## Quy tắc bất di bất dịch

Bốn quy tắc giao diện, chi tiết ở [ui-guidelines.md](ui-guidelines.md):

1. Không gradient
2. Không tracking
3. Font: chỉ Inter
4. Icon: chỉ lucide-react

Kiểm tra: `npm run check:ui`

Một quy tắc API, chi tiết ở [api/README.md](api/README.md#phân-tách-dữ-liệu-theo-người-dùng):

- Mọi truy vấn lọc theo `userId` lấy từ **phiên đăng nhập**, không bao giờ từ
  tham số client gửi lên.

## Nguồn sự thật

Khi tài liệu và code mâu thuẫn, code đúng — và tài liệu là bug cần sửa.

| Thứ                 | Nguồn                                 |
| ------------------- | ------------------------------------- |
| Shape dữ liệu       | `src/types/index.ts`                  |
| Database            | `prisma/schema.prisma`                |
| Điều hướng          | `src/config/nav.ts`                   |
| Màu, cỡ chữ, bo góc | `src/app/globals.css` (khối `@theme`) |
