# Chi tiêu API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module quản lý giao dịch thu/chi và danh mục chi tiêu. Map tới model `Expense` và
`ExpenseCategory` trong `prisma/schema.prisma`, khớp kiểu `Expense` /
`ExpenseCategory` trong `src/types/index.ts`.

Ngoài CRUD, module có thêm `GET /api/expenses/summary` trả số liệu tổng hợp theo
tháng — phần logic hiện đang chạy ở client trong `src/lib/finance.ts`.

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/expenses` | Danh sách giao dịch, lọc theo khoảng ngày / danh mục / loại. |
| POST | `/api/expenses` | Tạo giao dịch. |
| GET | `/api/expenses/:id` | Chi tiết một giao dịch. |
| PATCH | `/api/expenses/:id` | Cập nhật một phần giao dịch. |
| DELETE | `/api/expenses/:id` | Xoá giao dịch. |
| GET | `/api/expenses/summary` | Tổng thu, tổng chi và tỉ lệ theo danh mục của một tháng. |
| GET | `/api/expense-categories` | Danh sách danh mục. |
| POST | `/api/expense-categories` | Tạo danh mục. |
| PATCH | `/api/expense-categories/:id` | Cập nhật danh mục. |
| DELETE | `/api/expense-categories/:id` | Xoá danh mục — chặn nếu còn giao dịch. |

## GET /api/expenses

Danh sách giao dịch của người dùng đang đăng nhập, mặc định mới nhất trước.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `from` | ISO 8601 | không | — | Chỉ lấy giao dịch có `spentAt` ≥ giá trị này. |
| `to` | ISO 8601 | không | — | Chỉ lấy giao dịch có `spentAt` ≤ giá trị này. |
| `categoryId` | string | không | — | Lọc theo một danh mục. |
| `kind` | `expense` \| `income` | không | — | Bỏ trống thì trả cả hai loại. |
| `q` | string | không | — | Tìm trong `note`. |
| `sort` | string | không | `-spentAt` | Cho phép: `spentAt`, `amount`, `createdAt`. |
| `page` | số nguyên | không | `1` | Xem README. |
| `perPage` | số nguyên | không | `20` | Xem README. |

`from` và `to` độc lập: gửi một trong hai cũng hợp lệ. Cả hai đều **bao gồm** mốc
đó (inclusive).

**Response 200**

```json
{
  "data": [
    {
      "id": "exp_04",
      "amount": 340000,
      "kind": "expense",
      "note": "Cơm trưa văn phòng",
      "categoryId": "cat_01",
      "spentAt": "2026-07-14T12:00:00.000Z"
    },
    {
      "id": "exp_07",
      "amount": 270000,
      "kind": "expense",
      "note": "Gửi xe tháng",
      "categoryId": "cat_02",
      "spentAt": "2026-07-13T08:00:00.000Z"
    },
    {
      "id": "exp_14",
      "amount": 247500,
      "kind": "expense",
      "note": "Cà phê với bạn",
      "categoryId": "cat_05",
      "spentAt": "2026-07-13T16:30:00.000Z"
    },
    {
      "id": "exp_03",
      "amount": 517500,
      "kind": "expense",
      "note": "Cà phê & ăn sáng",
      "categoryId": "cat_01",
      "spentAt": "2026-07-11T08:15:00.000Z"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 16, "totalPages": 1 }
}
```

(Ví dụ rút gọn còn 4 trong 16 giao dịch của dữ liệu mẫu cho dễ đọc — response
thật trả đủ 16.)

Response **không** kèm object danh mục. Client tự nối bằng `categoryId` — danh
sách danh mục chỉ có vài phần tử, tải một lần rồi dùng lại cho mọi giao dịch, rẻ
hơn nhiều so với lặp lại tên và màu trong từng dòng.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `from`/`to` không phải ISO 8601, `kind` hoặc `sort` sai giá trị. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/expenses

Tạo giao dịch.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `amount` | số nguyên | có | — | Đơn vị đồng, phải > 0. Luôn dương. |
| `kind` | `expense` \| `income` | không | `expense` | Quyết định chiều tiền. |
| `note` | string \| null | không | `null` | |
| `categoryId` | string | có | — | Phải là danh mục của chính người dùng. |
| `spentAt` | ISO 8601 | có | — | Thời điểm phát sinh, không phải thời điểm nhập. |

```json
{
  "amount": 517500,
  "kind": "expense",
  "note": "Cà phê & ăn sáng",
  "categoryId": "cat_01",
  "spentAt": "2026-07-11T08:15:00.000Z"
}
```

**Response 201** — giao dịch vừa tạo.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `amount`/`categoryId`/`spentAt`, hoặc `amount` không phải số nguyên, hoặc `kind` sai giá trị. |
| 400 | `MALFORMED_JSON` | Body không phải JSON hợp lệ. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | `categoryId` không tồn tại, hoặc thuộc người dùng khác. |
| 422 | `UNPROCESSABLE` | `amount` ≤ 0. |

`categoryId` trỏ tới danh mục người khác trả `404`, không phải `403` — xem lý do
trong README. Đây cũng là chỗ chặn việc gắn giao dịch của mình vào danh mục
người khác, nên **bắt buộc** kiểm tra `userId` của danh mục trước khi ghi, không
chỉ kiểm tra danh mục có tồn tại.

## GET /api/expenses/:id

Chi tiết một giao dịch.

**Response 200** — một object `Expense`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## PATCH /api/expenses/:id

Cập nhật một phần giao dịch. Nhận cùng tập trường như `POST /api/expenses`, tất
cả đều tuỳ chọn.

```json
{ "amount": 520000, "categoryId": "cat_02" }
```

**Response 200** — giao dịch sau khi cập nhật.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Trường sai kiểu hoặc `kind` sai giá trị. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Giao dịch hoặc `categoryId` mới không tồn tại / thuộc người khác. |
| 422 | `UNPROCESSABLE` | `amount` ≤ 0. |

## DELETE /api/expenses/:id

Xoá hẳn giao dịch, không lưu thùng rác.

**Response 204** — không có body.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |

## GET /api/expenses/summary

Số liệu tổng hợp của một tháng: tổng chi, tổng thu, số dư và tỉ lệ chi theo từng
danh mục. Đây là dữ liệu cho biểu đồ tròn và legend ở dashboard.

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `month` | `YYYY-MM` | không | tháng hiện tại | Tháng cần tổng hợp. |

`month` dùng dạng `YYYY-MM` chứ không phải hai tham số `from`/`to`: "tháng 7" là
đúng một khái niệm, để client tự tính mốc đầu/cuối tháng thì mỗi client sẽ tính
lệch một kiểu ở biên nửa đêm.

**Response 200**

```json
{
  "data": {
    "month": "2026-07",
    "totalSpent": 8450000,
    "totalIncome": 29500000,
    "net": 21050000,
    "breakdown": [
      { "categoryId": "cat_01", "name": "Ăn uống",   "color": "clay",   "total": 2957500, "share": 35 },
      { "categoryId": "cat_02", "name": "Di chuyển", "color": "brand",  "total": 1690000, "share": 20 },
      { "categoryId": "cat_03", "name": "Mua sắm",   "color": "sage",   "total": 1267500, "share": 15 },
      { "categoryId": "cat_04", "name": "Học tập",   "color": "violet", "total": 1267500, "share": 15 },
      { "categoryId": "cat_05", "name": "Giải trí",  "color": "sand",   "total": 1267500, "share": 15 }
    ]
  }
}
```

Số trong ví dụ là dữ liệu thật từ `src/lib/mock/expenses.ts`:
2.957.500 + 1.690.000 + 1.267.500 × 3 = **8.450.000**. Tổng thu 25.000.000 +
4.500.000 = **29.500.000**, `net` = 29.500.000 − 8.450.000 = **21.050.000**.

`breakdown` sắp theo `total` giảm dần và **chỉ chứa danh mục có `total > 0`** —
danh mục không phát sinh chi trong tháng bị loại, không trả về với `total: 0`, vì
biểu đồ tròn không vẽ được lát 0% và legend không nên có dòng thừa.

`totalSpent` và `breakdown` chỉ tính `kind: "expense"`. Trong mock, hai giao dịch
thu nhập `exp_15` và `exp_16` gắn `categoryId: "cat_01"` (Ăn uống) nhưng **không**
làm thay đổi con số 2.957.500 của Ăn uống — bộ lọc theo `kind` diễn ra trước khi
gom nhóm.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `month` không đúng dạng `YYYY-MM`, hoặc tháng ngoài 01–12. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

Tháng không có giao dịch nào **không** phải lỗi: trả `200` với `totalSpent: 0`,
`totalIncome: 0`, `net: 0` và `breakdown: []`. Client hiển thị trạng thái rỗng.

## GET /api/expense-categories

Toàn bộ danh mục của người dùng. Không phân trang — số danh mục vốn nhỏ (mock có
5) và client cần cả danh sách để nối tên/màu cho giao dịch và để đổ vào dropdown.

**Query params** — không có.

**Response 200**

```json
{
  "data": [
    { "id": "cat_01", "name": "Ăn uống",   "color": "clay",   "monthlyBudget": 3500000 },
    { "id": "cat_02", "name": "Di chuyển", "color": "brand",  "monthlyBudget": 2000000 },
    { "id": "cat_03", "name": "Mua sắm",   "color": "sage",   "monthlyBudget": 1500000 },
    { "id": "cat_04", "name": "Học tập",   "color": "violet", "monthlyBudget": 1500000 },
    { "id": "cat_05", "name": "Giải trí",  "color": "sand",   "monthlyBudget": 1000000 }
  ]
}
```

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |

## POST /api/expense-categories

Tạo danh mục.

**Request body**

| Trường | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `name` | string | có | — | 1–60 ký tự. |
| `color` | `EventColor` | không | `brand` | `brand` \| `clay` \| `violet` \| `sage` \| `sand`. |
| `monthlyBudget` | số nguyên \| null | không | `null` | Hạn mức tháng, đơn vị đồng. `null` = không đặt hạn mức. |

```json
{ "name": "Sức khoẻ", "color": "sage", "monthlyBudget": 1000000 }
```

**Response 201** — danh mục vừa tạo.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `name`, hoặc `color` không thuộc `EventColor`. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 422 | `UNPROCESSABLE` | `monthlyBudget` ≤ 0 (dùng `null` nếu muốn bỏ hạn mức, không dùng `0`). |

`monthlyBudget: 0` và `monthlyBudget: null` khác nhau: `0` nghĩa là "hạn mức bằng
không, tiêu đồng nào cũng vượt", `null` nghĩa là "không theo dõi hạn mức". Chỉ
`null` có ý nghĩa trong giao diện nên `0` bị chặn.

## PATCH /api/expense-categories/:id

Cập nhật danh mục. Nhận cùng tập trường như `POST`, tất cả tuỳ chọn.

```json
{ "monthlyBudget": null }
```

**Response 200** — danh mục sau khi cập nhật.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Trường sai kiểu, hoặc `color` không thuộc `EventColor`. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |
| 422 | `UNPROCESSABLE` | `monthlyBudget` ≤ 0. |

## DELETE /api/expense-categories/:id

Xoá danh mục. **Chỉ thành công khi danh mục không còn giao dịch nào.**

**Response 204** — không có body.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 404 | `NOT_FOUND` | Không tồn tại, hoặc thuộc người dùng khác. |
| 409 | `CONFLICT` | Danh mục còn ít nhất một giao dịch. |

**Response 409**

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Danh mục \"Ăn uống\" còn 6 giao dịch. Hãy chuyển chúng sang danh mục khác trước khi xoá."
  }
}
```

Xem [Không xoá được danh mục còn giao dịch](#không-xoá-được-danh-mục-còn-giao-dịch)
bên dưới.

## Quy tắc nghiệp vụ

### Tiền là số nguyên, đơn vị đồng, luôn dương

`Expense.amount` khai báo `Int` và **luôn dương**, kể cả với khoản chi.

Số nguyên chứ không phải số thực: `0.1 + 0.2 !== 0.3` trong số thực nhị phân, và
sai số tích luỹ theo từng phép cộng — đúng thứ mà bảng tổng chi làm liên tục.
Đồng là đơn vị nhỏ nhất của VND nên không cần phần thập phân. Cùng quy ước với
`Goal.progressCurrent`, xem [goals.md](goals.md).

Chiều tiền do **`kind` quyết định**, không dùng số âm:

| `kind` | Ý nghĩa | `amount` |
|---|---|---|
| `expense` | Tiền ra | Dương |
| `income` | Tiền vào | Dương |

`{ "amount": 340000, "kind": "expense" }` chứ **không** phải
`{ "amount": -340000 }`.

Lý do: nếu chiều tiền nằm trong dấu của `amount`, mọi chỗ tính tổng đều phải nhớ
lọc dấu, và một dòng `amount: -25000000` trở nên nhập nhằng — chi âm (tức là
hoàn tiền) hay thu nhập nhập sai dấu? Tách thành hai trường thì mỗi trường trả
lời đúng một câu hỏi: `amount` là "bao nhiêu", `kind` là "chiều nào". Ràng buộc
`amount > 0` cũng kiểm tra được ngay ở tầng validation thay vì phải suy luận theo
ngữ cảnh.

Hệ quả: hoàn tiền/trả lại hàng ghi thành một giao dịch `kind: "income"`, không
phải một giao dịch `expense` với số âm.

### Không xoá được danh mục còn giao dịch

Quan hệ `Expense.category` khai báo `onDelete: Restrict` trong
`prisma/schema.prisma`. Database từ chối xoá danh mục còn giao dịch tham chiếu
tới, và Prisma ném lỗi ràng buộc khoá ngoại (`P2003`).

Lý do dùng `Restrict` thay vì `Cascade` hay `SetNull`:

- `Cascade` sẽ **xoá luôn mọi giao dịch** trong danh mục. Xoá nhầm danh mục "Ăn
  uống" là mất sạch lịch sử chi tiêu ăn uống — mất dữ liệu không khôi phục được,
  chỉ vì một cú nhấn.
- `SetNull` không dùng được: `Expense.categoryId` là `String` không nullable.
  Một khoản tiền không có danh mục thì mất hết ngữ cảnh và biến mất khỏi mọi
  biểu đồ, nhưng vẫn cộng vào tổng chi — sai lệch âm thầm, tệ hơn là báo lỗi.

Server phải bắt lỗi này và trả `409 CONFLICT` kèm thông báo dùng được, chứ không
để rơi thành `500`:

```ts
const count = await prisma.expense.count({
  where: { categoryId: params.id, userId: session.userId },
});
if (count > 0) {
  return error(409, "CONFLICT", `Danh mục "${category.name}" còn ${count} giao dịch. ...`);
}
```

**Gợi ý cho client:** khi nhận `409`, đừng chỉ hiện thông báo lỗi. Cách xử lý tốt
là mở hộp thoại cho người dùng chọn danh mục đích, gọi
`PATCH /api/expenses/:id` (hoặc một endpoint chuyển hàng loạt nếu số giao dịch
lớn) để chuyển toàn bộ giao dịch sang danh mục đó, rồi mới gọi lại `DELETE`.
Người dùng đang cố dọn dẹp danh mục, không phải đang cố xoá dữ liệu.

### `color` phải thuộc `EventColor`

SQLite lưu `color` dạng `String`, database không chặn. Server phải đối chiếu với
`EventColor` (`brand` | `clay` | `violet` | `sage` | `sand`). Màu lạ lọt qua sẽ
làm lát biểu đồ tròn mất màu vì client tra màu bằng bảng cố định.

### `share` làm tròn sao cho tổng luôn đúng 100%

`share` là **số nguyên phần trăm**. Làm tròn từng danh mục một cách độc lập thì
tổng thường lệch 1%:

```
34.9 → 35    20.1 → 20    14.8 → 15    14.9 → 15    15.0 → 15    = 100  ✅
34.4 → 34    20.4 → 20    15.1 → 15    15.0 → 15    15.1 → 15    =  99  ❌
```

Legend hiện 99% hoặc 101% trong khi biểu đồ tròn vẫn kín vòng — người dùng đọc
được ngay và mất tin vào con số.

Cách xử lý: làm tròn từng phần, cộng lại, rồi **bù toàn bộ phần dư vào danh mục
lớn nhất**. Danh mục lớn nhất chịu sai số 1% là ít lệch tương đối nhất (1% trên
35% là ~3%, còn 1% trên 3% là ~33%). Vì `breakdown` đã sắp giảm dần theo `total`,
danh mục lớn nhất chính là phần tử đầu:

```ts
const drift = 100 - rows.reduce((sum, row) => sum + row.share, 0);
if (drift !== 0 && rows.length > 0) rows[0].share += drift;
```

Với dữ liệu mock, các tỉ lệ chia hết đúng (35 + 20 + 15 + 15 + 15 = 100) nên
`drift` bằng 0 và không có danh mục nào bị bù. Bước bù vẫn phải có: dữ liệu thật
gần như không bao giờ tròn như vậy.

`share` **không** dùng để vẽ góc của lát biểu đồ — góc tính từ `total` để tránh
lỗi làm tròn tích luỹ thành khe hở. `share` chỉ để hiển thị dạng chữ.

## Ghi chú khi hiện thực

1. Route handler: `src/app/api/expenses/route.ts`,
   `src/app/api/expenses/[id]/route.ts`, `src/app/api/expenses/summary/route.ts`,
   `src/app/api/expense-categories/route.ts`,
   `src/app/api/expense-categories/[id]/route.ts`.

   Lưu ý thứ tự route: `summary` phải là segment tĩnh, đặt cùng cấp với
   `[id]`. Next.js ưu tiên segment tĩnh nên `/api/expenses/summary` không rơi vào
   `[id]` với `id = "summary"`.
2. **Chuyển logic thống kê từ client sang server.** `src/lib/finance.ts` hiện có
   `totalSpent()`, `totalIncome()` và `breakdownByCategory()` — chúng chạy trên
   toàn mảng mock trong trình duyệt. Khi có API:
   - `GET /api/expenses/summary` hiện thực lại đúng logic đó ở server, kể cả
     bước bù `drift`. Kiểu `CategoryBreakdown` trong `finance.ts` chính là shape
     của từng phần tử `breakdown`.
   - Client bỏ phần tính, chỉ hiển thị. Không giữ hai bản logic ở hai nơi —
     chúng sẽ lệch nhau.
   - Lý do chuyển: tính ở client buộc phải tải **toàn bộ** giao dịch của tháng
     về chỉ để cộng ra 5 con số. Với vài trăm giao dịch mỗi tháng thì đó là tải
     thừa rõ rệt, còn server chỉ cần một câu `groupBy`.
3. `breakdownByCategory()` hiện lọc theo `categories` được truyền vào và bỏ dòng
   `total === 0`. Bản server dùng `prisma.expense.groupBy({ by: ["categoryId"] })`
   với `where: { kind: "expense", ... }` — cách này tự nhiên chỉ trả về danh mục
   có giao dịch, rồi nối tên/màu từ bảng `ExpenseCategory`.
4. Biên của tháng phải tính theo **múi giờ người dùng**, không phải UTC. Với
   `month=2026-07` và giờ Việt Nam (UTC+7), khoảng cần lấy là
   `2026-06-30T17:00:00Z` ≤ `spentAt` < `2026-07-31T17:00:00Z`. Nếu cắt theo UTC,
   một khoản chi lúc 23:30 ngày 31/7 giờ Việt Nam sẽ bị tính sang tháng 8. Đây là
   lý do `HabitEntry.date` chọn kiểu `String` — xem [habits.md](habits.md) — còn
   ở đây thì `spentAt` cần cả giờ (giao dịch có thời điểm cụ thể) nên phải xử lý
   múi giờ tường minh.
5. Index `@@index([userId, spentAt])` phục vụ đúng cả `GET /api/expenses` có
   `from`/`to` lẫn `GET /api/expenses/summary`. Index `@@index([categoryId])`
   phục vụ bộ lọc `categoryId` và bước đếm giao dịch trước khi xoá danh mục.
6. Giao diện hiện đọc `expenses` và `expenseCategories` từ
   `src/lib/mock/expenses.ts`. Shape response khớp đúng, nên khi nối API chỉ cần
   thay import bằng fetch. Dữ liệu mock có thể giữ lại làm seed.
