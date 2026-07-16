# Kiến trúc

## Bức tranh tổng thể

Một ứng dụng Next.js duy nhất. Không có backend tách rời, không có API bên ngoài.

```
┌─────────────────────────────────────────────────────────┐
│  Trình duyệt                                            │
│    Server Component (HTML dựng sẵn, không tốn JS)       │
│    Client Component (chỉ phần cần tương tác)            │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Next.js                                                │
│    src/app/(app)/…      Trang module                    │
│    src/app/api/…        Route handler  ← CHƯA CÓ (GĐ 2) │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Dữ liệu                                                │
│    src/lib/mock/        ← ĐANG DÙNG (giai đoạn 1)       │
│    Prisma → SQLite      ← ĐÃ SẴN SÀNG, chưa nối vào UI  │
└─────────────────────────────────────────────────────────┘
```

## Hai giai đoạn

Dự án cố ý tách làm hai giai đoạn.

**Giai đoạn 1 (xong)** — giao diện đầy đủ, đọc dữ liệu từ `src/lib/mock/`.

**Giai đoạn 2 (chưa làm)** — route handler + database thật.

Điều làm cho việc chuyển giai đoạn rẻ: **cả hai giai đoạn dùng chung một shape
dữ liệu**.

```
src/types/index.ts  ←── nguồn sự thật
   ├── src/lib/mock/*        khớp shape này
   ├── prisma/schema.prisma  map 1-1 với shape này
   └── docs/api/*            đặc tả trả về đúng shape này
```

Nhờ vậy, nối API chủ yếu là đổi chỗ lấy dữ liệu:

```tsx
// Giai đoạn 1
import { tasks } from "@/lib/mock";

// Giai đoạn 2
const { data: tasks } = await fetch("/api/tasks").then((r) => r.json());
```

Phần JSX bên dưới không phải sửa. Nếu shape của API lệch khỏi `src/types`, lợi
thế này biến mất — nên khi hiện thực API, sửa `src/types` **trước**, rồi để
TypeScript chỉ ra mọi chỗ cần cập nhật.

## Nhóm route

`src/app/` dùng route group của Next.js (thư mục trong ngoặc đơn — không xuất
hiện trong URL):

| Nhóm | Layout | Chứa gì |
|---|---|---|
| *(gốc)* | `layout.tsx` — font Inter | Landing, 404, logout |
| `(auth)` | Khung 2 cột, cột trái xanh | login, register, forgot-password |
| `(app)` | Sidebar + Topbar | 10 trang của khu vực đã đăng nhập |

`(app)/layout.tsx` là nơi duy nhất cần kiểm tra session khi làm giai đoạn 2 —
mọi trang trong đó tự động được bảo vệ.

`/logout` nằm ngoài `(app)` vì nó không nên hiện sidebar.

## Server component và client component

Mặc định mọi thứ là server component. Chỉ thêm `"use client"` khi thật sự cần
state hoặc sự kiện của trình duyệt.

Khuôn mẫu áp dụng cho mọi module:

```
app/(app)/notes/page.tsx           server — có `export const metadata`
  └── components/notes/notes-browser.tsx    "use client" — giữ state lọc
        └── components/notes/note-card.tsx  thuần hiển thị, không directive
```

Có hai lý do, và lý do thứ nhất là ràng buộc cứng: **`export const metadata` và
`"use client"` không dùng chung một file được**. Nếu page là client component thì
mất metadata (tiêu đề tab, SEO). Đẩy phần tương tác xuống con thì có cả hai.

Lý do thứ hai: JS gửi xuống trình duyệt ít hơn. `NoteCard` không có state nên
không cần đi kèm React runtime của nó.

## Luồng dữ liệu ở giai đoạn 1

State cục bộ, không có thư viện quản lý state, không có server state.

- Bộ lọc và tìm kiếm: `useState` trong component `*-browser.tsx`
- Tick việc, chọn thư mục thư: `useState`, cập nhật trên bản sao mảng
- Không có persist — tải lại trang là về mặc định

Đây là lựa chọn có chủ đích cho giai đoạn 1. Thêm Redux/Zustand lúc này là gánh
nặng vô ích: khi có API, phần lớn state sẽ chuyển thành server state và tầng
quản lý đó sẽ bị vứt đi.

Khi làm giai đoạn 2, cân nhắc TanStack Query hoặc `useOptimistic` của React 19
cho cập nhật lạc quan.

## Các quyết định thiết kế

### Vì sao Tailwind v4 không có file config

Tailwind v4 khai báo token bằng CSS trong khối `@theme` ở `globals.css`. Không
còn `tailwind.config.js`.

Lợi ích thật: `--color-brand-600` vừa sinh ra class `bg-brand-600`, vừa dùng được
trực tiếp trong CSS và trong thuộc tính `stroke` của SVG. `DonutChart` khai thác
đúng điều này — nó đọc `var(--color-clay)` nên màu cung biểu đồ không bao giờ
lệch khỏi màu badge cùng danh mục.

### Vì sao tự viết biểu đồ thay vì dùng thư viện

Cả app chỉ có một biểu đồ tròn. Recharts nặng ~100 KB và kéo theo D3; `DonutChart`
trong `src/components/charts/` dài 70 dòng.

Kỹ thuật: mỗi cung là một `<circle>` với `stroke-dasharray` bằng độ dài cung, và
`stroke-dashoffset` đẩy nó tới vị trí bắt đầu. Xoay `-90°` để cung đầu bắt đầu từ
đỉnh.

Nếu sau này cần biểu đồ cột, đường, tooltip tương tác thì hãy dùng thư viện. Đừng
mở rộng file này thành một thư viện chart tự chế.

### Vì sao đồ thị tri thức trộn SVG với HTML

`GraphView` vẽ cạnh bằng SVG ở dưới, node bằng `<span>` HTML định vị tuyệt đối ở
trên.

Vẽ node bằng `<text>` của SVG thì phải tự tính bề rộng chữ để vẽ nền bo góc vừa
khít — SVG không có box model. Dùng HTML thì nhãn tự dùng font Inter, tự co giãn
theo nội dung, và style bằng đúng Tailwind như mọi chỗ khác.

`preserveAspectRatio="none"` trên SVG để hệ toạ độ 0–100 khớp với `left: x%` của
lớp HTML ở mọi tỉ lệ khung.

Ràng buộc kèm theo: node căn giữa quanh `(x, y)`, nên `x` phải nằm trong khoảng
~14–86 thì nhãn dài mới không tràn khung. Đã ghi trong `src/lib/mock/second-brain.ts`.

### Vì sao tiền là số nguyên

`Expense.amount`, `Goal.progressCurrent` đều là `Int`, đơn vị đồng.

Số thực nhị phân không biểu diễn chính xác được số thập phân — `0.1 + 0.2` cho
`0.30000000000000004`. Sai số nhỏ nhưng tích luỹ qua hàng nghìn giao dịch, và
bảng cân đối lệch vài đồng là loại lỗi rất tốn công truy.

Số tiền âm cũng không được dùng để biểu thị khoản chi. `amount` luôn dương, chiều
tiền do `kind` (`expense` | `income`) quyết định. Nếu dùng dấu âm, mọi truy vấn
tổng hợp đều phải nhớ xử lý dấu, và quên một chỗ là ra số sai mà không có lỗi nào
báo.

### Vì sao `HabitEntry.date` là String

Kiểu `String` dạng `"2026-07-15"`, không phải `DateTime`.

Thói quen gắn với **ngày theo lịch của người dùng**, không phải một thời điểm.
"Tôi thiền hôm nay" đúng bất kể lúc đó là 6 giờ sáng hay 11 giờ đêm. Nếu lưu
`DateTime`, việc một entry thuộc ngày nào lại phụ thuộc múi giờ khi truy vấn — và
người dùng đi công tác sẽ thấy chuỗi ngày của mình bị đứt.

`@@unique([habitId, date])` khiến ràng buộc "mỗi thói quen một entry mỗi ngày"
được database bảo đảm, không phụ thuộc code nhớ kiểm tra.

### Vì sao liên kết Second Brain lưu hai chiều

Liên kết giữa hai capture là vô hướng, nhưng `CaptureLink` lưu có hướng và mỗi
cạnh sinh **hai dòng** (A→B và B→A).

Đánh đổi: tốn gấp đôi số dòng, nhưng "mọi liên kết của X" chỉ cần quét một cột có
index. Nếu lưu một dòng, mỗi truy vấn phải `OR` trên hai cột — và với đồ thị,
truy vấn này chạy trên mọi node mỗi lần vẽ.

Cái giá là **ghi phải nằm trong transaction**. Chỉ ghi một dòng thì đồ thị khuyết
cạnh khi duyệt từ chiều ngược lại — và đó là loại lỗi chỉ lộ ra ở một hướng, rất
khó nhận thấy.

### Vì sao 404 thay vì 403

Xem [docs/api/README.md](api/README.md#mã-lỗi).

### Vì sao SQLite

Người mới clone repo về chạy được ngay: `npm install && npx prisma migrate dev`.
Không Docker, không server, không tài khoản cloud.

Không model nào dùng tính năng riêng của SQLite, nên chuyển sang Postgres là sửa
một dòng `provider`. Cái giá phải trả là SQLite không có kiểu enum và kiểu mảng:

| Muốn | Trong SQLite | Hệ quả |
|---|---|---|
| Enum | `String` + comment | Database không chặn giá trị sai — server phải kiểm tra |
| Mảng | Chuỗi JSON | Lọc theo tag không dùng được index |

Cả hai đều là **giới hạn có thật, không phải chi tiết cài đặt**. Chúng được ghi
rõ trong `prisma/schema.prisma` và tài liệu API của module liên quan.

## Ranh giới module

Module không import lẫn nhau. Chúng dùng chung:

- `src/types/` — kiểu dữ liệu
- `src/components/ui/` — primitives
- `src/lib/utils.ts` — hàm format
- `src/config/nav.ts` — điều hướng

Nếu hai module cần chung logic, nâng nó lên `src/lib/`, đừng import chéo. Ví dụ
`src/lib/finance.ts` được cả `ExpensesWidget` (dashboard) và trang `/expenses`
dùng.

`src/config/nav.ts` là nguồn sự thật duy nhất cho điều hướng: sidebar, menu
mobile và mục "Chín không gian" ở landing đều đọc từ đây. Thêm module mới chỉ cần
thêm một entry.

## Giới hạn hiện tại

Ghi ra để không ai nhầm chúng là đã xong:

1. **Không có xác thực thật.** Form login/register chỉ điều hướng sang
   `/dashboard`. Không có gì được bảo vệ.
2. **Không có persist.** Tick một việc rồi tải lại trang là mất.
3. **Không có upload.** Nút "Tải lên" ở Tài liệu chưa làm gì.
4. **Không có email thật.** Module Email đọc dữ liệu mẫu; chưa có IMAP/SMTP.
5. **Chỉ một người dùng.** Mọi mock data thuộc về `currentUser`.
6. **Chỉ giao diện sáng.** Chưa có chế độ tối.
7. **Toạ độ đồ thị hard-code.** Xem `docs/api/second-brain.md`, mục "Graph layout".
8. **Thói quen chỉ có 7 ngày dữ liệu.** Lưới nhiệt cố tình chỉ hiện khoảng có dữ
   liệu thật thay vì sinh số ngẫu nhiên cho đẹp.

## Thứ tự nên làm giai đoạn 2

1. `src/lib/api/` — helper dùng chung (`requireSession`, `json`, `error`,
   `parsePagination`)
2. Auth trước tiên — mọi thứ khác phụ thuộc `userId` từ session
3. `prisma/seed.ts` — đổ mock data vào database để có gì mà đọc
4. Nối từng module một, bắt đầu từ Công việc (đơn giản nhất) rồi tới Second Brain
   (phức tạp nhất)
5. Xoá `src/lib/mock/` khi không còn chỗ nào import
