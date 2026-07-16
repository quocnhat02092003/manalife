# Luma

> Cuộc sống rõ ràng. Ý tưởng không thất lạc.

Không gian quản lý cuộc sống cá nhân: lịch, công việc, ghi chú, mục tiêu, chi
tiêu, thói quen, email và tài liệu — cùng một **Second Brain** lưu lại và kết nối
mọi thứ bạn từng đọc.

## Trạng thái hiện tại

**Giai đoạn 1 — Giao diện (xong).** Toàn bộ 9 module có giao diện đầy đủ, chạy
được, đọc dữ liệu mẫu từ `src/lib/mock/`. Lọc, tìm kiếm, tick việc, chọn ngày,
chuyển thư mục đều hoạt động thật trên state phía client.

**Giai đoạn 2 — API (chưa làm).** Đã có sẵn nền:

- `prisma/schema.prisma` — 19 model, đã migrate và tạo được database thật
- `docs/api/` — đặc tả chi tiết từng endpoint
- `src/types/index.ts` — shape dữ liệu, khớp 1-1 với cả hai bên trên

Vì mock data đã dùng đúng shape của API tương lai, việc nối API chủ yếu là thay
import `@/lib/mock` bằng `fetch` — component gần như không phải sửa.

Những gì **chưa có**: route handler, đăng nhập thật (form hiện chỉ điều hướng),
upload file, tích hợp IMAP/SMTP.

## Bắt đầu

Yêu cầu: Node.js 20 trở lên (đang dùng 22).

```bash
npm install                 # postinstall tự chạy `prisma generate`
cp .env.example .env
npx prisma migrate dev      # tạo prisma/dev.db từ schema
npm run dev
```

Mở http://localhost:3000

Hai điều đáng biết:

- **`prisma generate` chạy trong `postinstall`, không phải trong `migrate`.**
  Prisma Client được sinh vào `src/generated/` và thư mục này không commit. Nếu
  build báo `Cannot find module '@/generated/prisma/client'`, chạy
  `npm run db:generate`.
- **`DATABASE_URL` giải tương đối với thư mục gốc dự án**, không phải thư mục
  `prisma/` — đây là thay đổi của Prisma 7. Vì vậy giá trị là
  `file:./prisma/dev.db` chứ không phải `file:./dev.db`.

Bước `migrate` chưa cần thiết để xem giao diện (mọi thứ đang chạy bằng mock
data), nhưng nó xác nhận schema hợp lệ và tạo sẵn database cho giai đoạn 2.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy server phát triển |
| `npm run build` | Build production |
| `npm start` | Chạy bản đã build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Kiểm tra kiểu, không sinh file |
| `npm run db:migrate` | Tạo và áp migration mới |
| `npm run db:studio` | Mở Prisma Studio để xem database |
| `npm run db:generate` | Sinh lại Prisma Client |
| `npm run check:ui` | Kiểm tra vi phạm quy tắc giao diện (gradient / tracking) |

## Công nghệ

| Thành phần | Lựa chọn | Vì sao |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server component để giảm JS gửi xuống client |
| Ngôn ngữ | TypeScript (strict) | |
| CSS | Tailwind v4 | Token khai báo trong CSS qua `@theme`, không cần file config |
| Font | Inter (`next/font/google`) | Có subset tiếng Việt |
| Icon | lucide-react | Nhất quán, tree-shake được |
| Database | Prisma 7 + SQLite | Chạy ngay, không cần cài server. Đổi sang Postgres = sửa 1 dòng |
| Ngày giờ | date-fns | Tree-shake được, API thuần hàm |
| Biểu đồ | SVG tự viết | Không cần thư viện chart cho một biểu đồ tròn |

Không dùng thư viện UI component (shadcn, MUI…) — primitives tự viết trong
`src/components/ui/` đủ dùng và không kéo theo hệ màu riêng cần ghi đè.

## Cấu trúc thư mục

```
manalife/
├── docs/                        Tài liệu — đọc docs/README.md trước
│   ├── architecture.md          Kiến trúc, luồng dữ liệu, quyết định thiết kế
│   ├── ui-guidelines.md         Quy tắc giao diện (BẮT BUỘC đọc trước khi sửa UI)
│   ├── data-model.md            Model dữ liệu và quan hệ
│   └── api/                     Đặc tả API từng endpoint
│       ├── README.md            Quy ước chung — đọc trước
│       ├── auth.md  calendar.md  tasks.md  notes.md  goals.md
│       └── expenses.md  habits.md  email.md  documents.md
│           second-brain.md  search.md
│
├── prisma/
│   ├── schema.prisma            19 model, map 1-1 với src/types
│   ├── migrations/              Lịch sử migration
│   └── dev.db                   SQLite (không commit)
├── prisma.config.ts             Chuỗi kết nối (Prisma 7 không để trong schema)
│
└── src/
    ├── app/
    │   ├── layout.tsx           Root layout — khai báo font Inter
    │   ├── globals.css          Design token (@theme) + quy tắc nền
    │   ├── page.tsx             Landing
    │   ├── not-found.tsx        404
    │   ├── logout/              Xác nhận đăng xuất
    │   ├── (auth)/              Nhóm route: login, register, forgot-password
    │   │   └── layout.tsx       Khung 2 cột
    │   └── (app)/               Nhóm route: khu vực đã đăng nhập
    │       ├── layout.tsx       Sidebar + Topbar
    │       ├── dashboard/       Tổng quan
    │       ├── calendar/  tasks/  notes/  habits/
    │       ├── goals/  expenses/  email/  documents/
    │       ├── second-brain/
    │       └── settings/
    │
    ├── components/
    │   ├── ui/                  Primitives — dùng lại, đừng viết lại
    │   ├── layout/              Sidebar, Topbar
    │   ├── dashboard/           Widget của trang Tổng quan
    │   ├── charts/              DonutChart (SVG thuần)
    │   ├── auth/                Form đăng nhập / đăng ký / quên mật khẩu
    │   ├── marketing/           Hình minh hoạ landing
    │   └── <module>/            Component riêng của từng module
    │
    ├── config/nav.ts            Nguồn sự thật duy nhất cho điều hướng
    ├── types/index.ts           Hợp đồng dữ liệu giữa UI và API
    ├── lib/
    │   ├── utils.ts             cn(), format tiền/ngày/kích thước file
    │   ├── finance.ts           Tính tỉ lệ chi tiêu theo danh mục
    │   ├── validation.ts        Kiểm tra form (server phải kiểm tra lại)
    │   ├── db.ts                Prisma client dùng chung
    │   └── mock/                Dữ liệu mẫu — sẽ bị thay bằng fetch ở GĐ 2
    └── generated/prisma/        Prisma Client sinh tự động (không commit)
```

Quy ước đặt tên: file dùng `kebab-case`, component dùng `PascalCase`, thư mục
module trong `components/` trùng tên với route trong `app/(app)/`.

## Chín module

| Module | Route | Làm gì |
|---|---|---|
| Tổng quan | `/dashboard` | Toàn cảnh một ngày trong một màn hình |
| Lịch | `/calendar` | Lưới tháng đầy đủ, sự kiện theo ngày |
| Công việc | `/tasks` | Nhóm theo quá hạn / hôm nay / sắp tới, lọc theo dự án |
| Ghi chú | `/notes` | Lưới masonry, tìm kiếm, tag, ghim, Markdown |
| Thói quen | `/habits` | Chuỗi ngày, lưới nhiệt, tiến độ tuần |
| Mục tiêu | `/goals` | Tiến độ, cột mốc, lọc theo khung thời gian |
| Chi tiêu | `/expenses` | Biểu đồ tròn, hạn mức, dòng giao dịch |
| Email | `/email` | Ba cột, lưu thư vào Second Brain |
| Tài liệu | `/documents` | Thư mục, tag, **cảnh báo sắp hết hạn** |
| Second Brain | `/second-brain` | Đồ thị tri thức, 7 loại nội dung, liên kết |

Second Brain là trung tâm của ý tưởng: bảy loại nội dung (ghi chú, bookmark,
video, podcast, email, tài liệu, hình ảnh) quy về **một shape chung** để tất cả
có thể tìm kiếm, gắn tag và liên kết với nhau trong cùng một đồ thị.

## Quy tắc giao diện

Bốn ràng buộc cứng, chi tiết ở [docs/ui-guidelines.md](docs/ui-guidelines.md):

1. **Không gradient** — chỉ màu phẳng
2. **Không tracking** — `letter-spacing` luôn `normal`
3. **Font: chỉ Inter**
4. **Icon: chỉ lucide-react**

Kiểm tra bằng `npm run check:ui` (phải không có kết quả nào).

Ngoài ra: không dùng màu mặc định của Tailwind (`gray-*`, `green-*`…) — chỉ dùng
token khai báo trong `globals.css`.

## Dữ liệu mẫu

Nằm ở `src/lib/mock/`, tiếng Việt, khớp với thiết kế gốc. Mọi ngày giờ tính
tương đối so với `TODAY` trong `src/lib/mock/dates.ts` nên dữ liệu không bị "cũ"
dù bạn mở app vào ngày nào.

Các con số được tính toán chứ không hard-code: tổng chi 8.450.000 ₫ là tổng thật
của 14 giao dịch, và tỉ lệ 35/20/15/15/15% do `src/lib/finance.ts` tính ra từ
chính các giao dịch đó.

## Chuyển sang PostgreSQL

1. `prisma/schema.prisma`: đổi `provider = "sqlite"` thành `"postgresql"`
2. `.env`: trỏ `DATABASE_URL` sang chuỗi kết nối Postgres
3. `src/lib/db.ts`: đổi adapter sang `@prisma/adapter-pg`
4. `npm run db:generate && npx prisma migrate dev`

Không model nào dùng tính năng riêng của SQLite. Hai chỗ đáng dọn sau khi
chuyển: `tags`/`linkedIds` đang lưu chuỗi JSON (Postgres có kiểu mảng thật) và
các enum đang lưu `String` (Postgres có enum thật). Cả hai đều chạy được nguyên
trạng, chỉ là chưa tối ưu.

## Đọc tiếp

- [docs/README.md](docs/README.md) — chỉ mục tài liệu
- [docs/architecture.md](docs/architecture.md) — kiến trúc và các quyết định
- [docs/api/README.md](docs/api/README.md) — quy ước API, đọc trước khi làm GĐ 2
