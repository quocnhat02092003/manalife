# Model dữ liệu

Nguồn sự thật: `prisma/schema.prisma` (database) và `src/types/index.ts` (shape
API và UI). Hai file này map 1-1 — đổi một bên phải đổi bên còn lại.

## Toàn cảnh

19 model. `User` là gốc của mọi thứ; xoá `User` là xoá sạch dữ liệu của người đó
(`onDelete: Cascade` trên mọi quan hệ).

```
User
├── Session                 phiên đăng nhập
├── CalendarEvent           Lịch
├── Project ──┐             Công việc
├── Task ─────┘
├── Note                    Ghi chú
├── Goal ──── Milestone     Mục tiêu
├── ExpenseCategory ──┐     Chi tiêu
├── Expense ──────────┘
├── Habit ──── HabitEntry   Thói quen
├── EmailMessage ── Attachment   Email
├── DocumentFolder ──┐      Tài liệu
├── PersonalDocument ┘
└── Capture ──── CaptureLink     Second Brain

PasswordResetToken           đứng riêng, khoá theo email
```

## Hành vi khi xoá

Chọn có chủ đích cho từng quan hệ — chúng mã hoá quy tắc nghiệp vụ, không phải
mặc định tuỳ tiện.

| Quan hệ | Hành vi | Vì sao |
|---|---|---|
| `User` → mọi thứ | `Cascade` | Xoá tài khoản là xoá hết dữ liệu |
| `Project` → `Task` | `SetNull` | Xoá dự án thì việc vẫn còn, chỉ mất nhãn dự án |
| `DocumentFolder` → `PersonalDocument` | `SetNull` | Xoá thư mục không được xoá giấy tờ |
| `ExpenseCategory` → `Expense` | **`Restrict`** | Chặn xoá danh mục còn giao dịch |
| `Goal` → `Milestone` | `Cascade` | Cột mốc không tồn tại độc lập |
| `Habit` → `HabitEntry` | `Cascade` | Lịch sử không có nghĩa nếu thói quen biến mất |
| `EmailMessage` → `Attachment` | `Cascade` | File đính kèm thuộc về thư |
| `Capture` → `CaptureLink` | `Cascade` | Cạnh biến mất khi node biến mất |

`Restrict` cho danh mục chi tiêu là ngoại lệ duy nhất. Nếu để `SetNull`, giao dịch
"890.000 ₫" sẽ mất ngữ cảnh nó là khoản gì — số tiền không danh mục là dữ liệu vô
dụng. API trả `409 CONFLICT` và client phải yêu cầu chuyển giao dịch sang danh
mục khác trước.

## Giới hạn của SQLite

SQLite không có kiểu enum và kiểu mảng. Hệ quả rải khắp schema:

### Enum lưu dạng String

```prisma
/// TaskStatus: todo | done
status String @default("todo")
```

Giá trị hợp lệ ghi trong comment và ràng buộc bằng type TypeScript.

**Database không chặn giá trị sai.** `status: "banana"` sẽ được ghi xuống bình
thường. Server bắt buộc phải kiểm tra — đây không phải chuyện tuỳ chọn.

| Trường | Model | Giá trị hợp lệ |
|---|---|---|
| `color` | nhiều model | `brand` `clay` `violet` `sage` `sand` |
| `status` | `Task` | `todo` `done` |
| `priority` | `Task` | `low` `medium` `high` |
| `status` | `Goal` | `active` `done` `paused` |
| `horizon` | `Goal` | `quarter` `year` `life` |
| `kind` | `Expense` | `expense` `income` |
| `folder` | `EmailMessage` | `inbox` `sent` `archive` `trash` |
| `kind` | `PersonalDocument` | `pdf` `image` `sheet` `doc` `other` |
| `type` | `Capture` | `note` `bookmark` `video` `podcast` `email` `document` `image` |

**`starred` không nằm trong danh sách `folder` của `EmailMessage`.** Nó là cột
`Boolean` riêng, lọc xuyên thư mục. Đây là chỗ dễ hiểu sai nhất của model này.

### Mảng lưu dạng chuỗi JSON

```prisma
/// Mảng JSON các tag, ví dụ: ["sách","thói quen"]
tags String @default("[]")
```

Áp dụng cho `Note.tags`, `PersonalDocument.tags`, `Capture.tags`.

API nhận và trả **mảng thật**; tầng API chịu trách nhiệm parse/serialize. `JSON.parse`
phải có fallback — một hàng hỏng không được làm sập cả trang.

Cái giá: lọc theo tag phải dùng `contains` trên chuỗi, **không dùng được index**.
Chấp nhận được ở quy mô cá nhân. Khi dữ liệu lớn, tách bảng `Tag` + bảng nối.

## Các quyết định về kiểu

### Tiền: `Int`, đơn vị đồng

`Expense.amount`, `ExpenseCategory.monthlyBudget`, `Goal.progressCurrent/Target`
khi `unit = "₫"`.

Không dùng `Float`. Xem [architecture.md](architecture.md#vì-sao-tiền-là-số-nguyên).

`amount` **luôn dương**. Chiều tiền do `kind` quyết định, không dùng dấu âm.

### `HabitEntry.date`: `String`, không phải `DateTime`

Dạng `"2026-07-15"`. Xem
[architecture.md](architecture.md#vì-sao-habitentrydate-là-string).

`@@unique([habitId, date])` — mỗi thói quen tối đa một entry mỗi ngày, do
database bảo đảm. API dùng **upsert**, không dùng create.

### `CaptureLink`: hai dòng cho một cạnh

Liên kết vô hướng nhưng lưu có hướng. Xem
[architecture.md](architecture.md#vì-sao-liên-kết-second-brain-lưu-hai-chiều).

Ghi phải nằm trong transaction, xoá phải xoá cả hai dòng.

### `Session.tokenHash`, không phải `token`

Chỉ lưu SHA-256 của token. Rò rỉ database vẫn không mạo danh được phiên nào. Xem
[api/auth.md](api/auth.md#vòng-đời-phiên).

## Index

Chọn theo truy vấn mà UI thật sự chạy, không phải rắc bừa lên mọi cột.

| Index | Truy vấn nó phục vụ |
|---|---|
| `CalendarEvent(userId, startsAt)` | "Sự kiện của tôi trong tháng này" — lưới lịch luôn hỏi theo khoảng ngày |
| `Task(userId, status)` | Lọc theo Chưa xong / Đã xong |
| `Task(userId, dueAt)` | Nhóm Quá hạn / Hôm nay / Sắp tới |
| `Note(userId, updatedAt)` | Ghi chú mới nhất lên đầu |
| `Expense(userId, spentAt)` | Giao dịch trong tháng, thống kê |
| `EmailMessage(userId, folder, receivedAt)` | Mở một thư mục, mới nhất trước |
| `EmailMessage(userId, starred)` | Filter "Có gắn sao" xuyên thư mục |
| `PersonalDocument(userId, expiresAt)` | **Cảnh báo sắp hết hạn** |
| `Capture(userId, type)` | Lọc theo 7 loại nội dung |
| `HabitEntry(habitId, date)` unique | Vừa là ràng buộc, vừa phục vụ upsert |

Thứ tự cột quan trọng: `(userId, startsAt)` phục vụ được "userId = X AND startsAt
BETWEEN a AND b" vì cột lọc bằng đứng trước cột lọc khoảng. Đảo lại thì không.

## Trường server tự quản

Client **không được gửi** những trường này; server tự đặt. Nếu tin client, dữ
liệu sẽ mâu thuẫn với chính nó.

| Trường | Quy tắc |
|---|---|
| `id` | `cuid()` |
| `userId` | Lấy từ phiên đăng nhập |
| `createdAt` / `updatedAt` | Prisma tự quản |
| `Task.completedAt` | Suy ra từ `status`: `done` → `now()`, `todo` → `null` |
| `Session.tokenHash` | Băm từ token vừa sinh |
| `User.passwordHash` | Băm bằng argon2id |
| `PersonalDocument.size` / `kind` | Suy ra từ file thật, không lấy theo lời khai |

Bất biến của `Task`: `status === "done"` ⟺ `completedAt !== null`. Nếu để client
gửi `completedAt`, sẽ có việc "chưa xong" nhưng lại có ngày hoàn thành.

`PersonalDocument.kind` và `size` phải suy ra từ file đã upload, không lấy từ
phần mở rộng tên file — `virus.exe` đổi tên thành `report.pdf` vẫn là `virus.exe`.
