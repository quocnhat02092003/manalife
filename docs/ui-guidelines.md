# Quy tắc giao diện

Bốn quy tắc dưới đây là ràng buộc cứng của dự án, không phải gợi ý. Chúng được
nhắc lại trong comment đầu `src/app/globals.css`.

## 1. Không dùng gradient

Không `linear-gradient`, không `bg-gradient-to-*`, không `radial-gradient`.
Chỉ màu phẳng.

```tsx
// ĐÚNG
<div className="bg-brand-600" />

// SAI
<div className="bg-gradient-to-r from-brand-600 to-brand-400" />
```

Cần phân tầng độ sâu thì dùng màu nền khác nhau (`surface` trên `canvas`) và
đường viền `line`, không dùng chuyển sắc.

## 2. Không dùng tracking

Không dùng class `tracking-*` nào, kể cả trên heading lớn. `globals.css` đã đặt
`letter-spacing: normal` cho mọi phần tử — đừng ghi đè.

```tsx
// SAI
<h1 className="text-5xl tracking-tight">Luma</h1>
```

Inter đã được thiết kế với khoảng cách chữ cân ở mọi cỡ. Siết tracking ở cỡ lớn
là thói quen từ thời các font hệ thống cũ, và nó làm chữ tiếng Việt có dấu bị
chật — dấu mũ và dấu thanh cần khoảng thở theo chiều ngang.

## 3. Font: chỉ Inter

Khai báo một lần duy nhất trong `src/app/layout.tsx` qua `next/font/google`, có
kèm subset `vietnamese`. Không import font nào khác, không dùng `@font-face` thủ
công.

## 4. Icon: chỉ lucide-react

Không dùng react-icons, heroicons, tabler hay SVG dán thẳng vào JSX.

Cỡ icon dùng prop `size`, không dùng class:

```tsx
// ĐÚNG
<Plus size={17} />

// SAI
<Plus className="size-4" />
```

Ngoại lệ duy nhất là hình minh hoạ (`src/components/marketing/still-life.tsx`)
và biểu đồ (`src/components/charts/`) — đó là đồ hoạ, không phải icon.

**Bẫy đặt tên:** icon `Image` của lucide trùng tên với `next/image`. Luôn import
là `Image as ImageIcon`.

---

## Kiểm tra tự động

Chạy trước khi commit — cả hai lệnh phải **không trả về kết quả nào**:

```bash
grep -rn "tracking-" src/ | grep -v "src/generated"
grep -rniE "bg-gradient|linear-gradient|radial-gradient" src/ | grep -v "src/generated"
```

---

## Bảng màu

Định nghĩa trong `@theme` của `src/app/globals.css`. **Không dùng màu mặc định
của Tailwind** (`gray-*`, `green-*`, `red-*`…) — chúng không thuộc hệ màu này và
sẽ lệch tông ngay lập tức.

### Brand — xanh lá đậm

`brand-50` … `brand-900`. Dùng cho hành động chính, trạng thái active, nhấn mạnh.

| Token | Dùng ở đâu |
|---|---|
| `brand-50` | Nền mục đang chọn ở sidebar, nền badge nhẹ |
| `brand-100` | Nền avatar |
| `brand-500` | Viền focus, cạnh đồ thị |
| `brand-600` | Nút chính, ô tick đã chọn, ngày hôm nay |
| `brand-700` | Wordmark, hover của nút chính, nền cột auth |

### Accent — chỉ để phân loại

`clay`, `violet`, `sage`, `sand`, mỗi màu có biến thể `-soft` làm nền.

Dùng cho: chấm sự kiện trong lịch, cung biểu đồ tròn, badge phân loại, ô icon.

**Không dùng làm nền lớn.** Chúng tồn tại để phân biệt hạng mục, không phải để
trang trí.

### Neutral

| Token | Dùng ở đâu |
|---|---|
| `canvas` | Nền ngoài cùng của khu vực app |
| `surface` | Nền thẻ |
| `surface-muted` | Nền chìm, ô input, nền trang auth |
| `line` | Viền thẻ, đường phân cách |
| `line-strong` | Viền input, viền ô tick chưa chọn |
| `ink` | Chữ chính |
| `ink-soft` | Chữ phụ, mô tả |
| `ink-faint` | Nhãn mờ, placeholder |

### Semantic

`success`, `warning`, `danger`, `info`.

**Cạm bẫy tương phản:** `warning` (`#c8912f`) đi với chữ trắng chỉ đạt ~2.9:1 —
không đạt chuẩn WCAG AA. Dùng `bg-warning text-brand-900` (~5.8:1). `danger` với
chữ trắng thì ổn (~6.5:1).

## Bậc chữ

Cỡ chữ đặt tường minh bằng `text-[Npx]` thay vì dùng thang mặc định của Tailwind
— các thẻ trong thiết kế cần những cỡ như 13px và 15px mà thang mặc định không có.

| Vai trò | Cỡ | Độ đậm |
|---|---|---|
| Wordmark hero | `text-[84px]` → `text-[100px]` | `font-bold` |
| Tiêu đề trang | `text-[26px]` | `font-semibold` |
| Tiêu đề thẻ | `text-[15px]` | `font-semibold` |
| Nội dung | `text-sm` (14px) | `font-normal` |
| Phụ | `text-[13px]` | `font-normal` |
| Nhãn nhỏ | `text-[12px]` / `text-[11px]` | `font-medium` |

`font-variant-numeric: tabular-nums` được đặt sẵn ở `body`: số có bề rộng đều
nhau nên các cột số tiền và tiến độ không bị nhảy khi giá trị thay đổi.

## Bo góc

| Token | Giá trị | Dùng ở đâu |
|---|---|---|
| `rounded-card` | 16px | Thẻ |
| `rounded-panel` | 20px | Khung ngoài cùng của landing |
| `rounded-xl` | 12px | Nút lớn, ô icon lớn |
| `rounded-lg` | 8px | Nút, input, mục sidebar |
| `rounded-full` | — | Ô tick, chấm, avatar |

## Primitives

Ở `src/components/ui/`. **Dùng lại, đừng viết lại.**

| Component | File | Ghi chú |
|---|---|---|
| `Card` và các phần | `card.tsx` | `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| `Button`, `IconButton` | `button.tsx` | `IconButton` bắt buộc có `aria-label` |
| `Input`, `Textarea`, `Field` | `input.tsx` | `Field` bọc label + input + lỗi |
| `Checkbox` | `checkbox.tsx` | Ô tick tròn, bắt buộc có `label` |
| `Badge`, `Dot` | `badge.tsx` | |
| `Progress`, `DotStreak` | `progress.tsx` | `Progress` nhận thêm tone `danger` |
| `IconTile` | `icon-tile.tsx` | Ô icon vuông cạnh tiêu đề thẻ |
| `Avatar` | `avatar.tsx` | Chữ cái đầu |
| `EmptyState` | `empty-state.tsx` | |
| `PageHeader` | `page-header.tsx` | |

## Bố cục có trạng thái

Trang module tuân theo một khuôn duy nhất:

```
src/app/(app)/<module>/page.tsx     ← server component, có `export const metadata`
src/components/<module>/<x>-browser.tsx  ← "use client", giữ state lọc/tìm kiếm
src/components/<module>/<x>-card.tsx     ← thuần hiển thị, không directive
```

Lý do: `export const metadata` và `"use client"` không dùng chung một file được.
Giữ page ở phía server rồi đẩy phần tương tác xuống component con thì có cả hai,
và bundle gửi xuống trình duyệt cũng nhỏ hơn.

## Đáp ứng bề rộng

Widget dashboard xuất hiện ở **hai chỗ có bề rộng khác nhau**: dashboard (cột
rộng) và landing (cột hẹp). Khi bố cục cần thay đổi theo bề rộng, dùng
**container query** chứ không dùng breakpoint màn hình:

```tsx
<div className="@container">
  <div className="flex flex-col @[240px]:flex-row">
```

`ExpensesWidget` là ví dụ: dùng `sm:` thì ở landing, màn hình rộng nhưng cột hẹp,
legend vẫn nằm ngang và tên "Di chuyển" bị cắt cụt. Container query phản ứng theo
bề rộng thật của thẻ nên xử lý đúng cả hai chỗ.

## Trợ năng

- `IconButton` và `Checkbox` bắt buộc có `aria-label` / `label`.
- Ngày đang chọn trong lịch dùng `aria-current`.
- `Progress` có `role="progressbar"` kèm `aria-valuenow`.
- `DonutChart` có `role="img"` và `aria-label` liệt kê đầy đủ tỉ lệ — người dùng
  screen reader không "nhìn" được biểu đồ.
- Màu **không bao giờ** là kênh thông tin duy nhất: badge ưu tiên có cả chữ, việc
  đã xong có cả gạch ngang chứ không chỉ đổi màu.
- Focus ring chỉ hiện với `:focus-visible` — người dùng chuột không thấy, người
  dùng bàn phím vẫn có.
- `prefers-reduced-motion` đã được xử lý ở `globals.css`.
