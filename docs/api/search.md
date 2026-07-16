# Tìm kiếm API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module này phục vụ **ô tìm kiếm toàn cục** ở Topbar — ô "Tìm trong mọi thứ bạn đã
lưu…" trong `src/components/layout/topbar.tsx`. Nó tìm **xuyên module**: một từ
khoá, kết quả từ ghi chú, công việc, capture, thư, tài liệu, sự kiện và mục tiêu
cùng lúc.

Khác với `?q=` của từng module (chỉ tìm trong module đó), endpoint này là đường
duy nhất tìm được mọi thứ mà không cần biết trước nó nằm ở đâu. Đó cũng là điểm
mạnh: người dùng nhớ "cái gì đó về Atomic Habits" nhưng không nhớ mình đã lưu nó
thành ghi chú hay bookmark.

Module này **không có model riêng** trong `prisma/schema.prisma`. Nó đọc từ các
bảng đã có.

## Tổng quan endpoint

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/search` | Tìm kiếm toàn cục xuyên module. |

Một endpoint, chỉ đọc. Không có `POST`, không có lịch sử tìm kiếm, không có gợi ý
đã lưu — không có bảng nào để chứa chúng.

## GET /api/search

**Query params**

| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `q` | chuỗi | **có** | — | Từ khoá. Tối thiểu 2 ký tự sau khi trim. |
| `types` | chuỗi | không | tất cả | Danh sách loại, ngăn bằng dấu phẩy: `types=note,task,capture`. |
| `limit` | số nguyên | không | `5` | Số kết quả **mỗi loại**. Kẹp ở 1–20. |

**`q` là bắt buộc.** Không có `q` → `400`, không phải "trả về mọi thứ". Tìm kiếm
không từ khoá là một lời mời quét toàn bộ database.

**Tối thiểu 2 ký tự.** `q=a` khớp gần như mọi bản ghi và tốn đúng chi phí như một
truy vấn có ích. Dưới ngưỡng → `400`, để client biết mà không hiện gì thay vì hiện
danh sách vô nghĩa.

**`limit` là giới hạn *mỗi loại*, không phải tổng.** `limit=5` với 7 loại có thể
trả tối đa 35 kết quả. Đây là ô tìm nhanh ở Topbar, không phải trang kết quả —
người dùng muốn thấy vài kết quả tốt nhất từ **mỗi** nơi, không phải 20 ghi chú
đẩy mọi loại khác ra khỏi màn hình. Cắt theo loại giữ cho mỗi module luôn có mặt.

**Không phân trang.** Không có `page`/`perPage`. Nếu kết quả không nằm trong
`limit` đầu, người dùng gõ thêm từ khoá — nhanh hơn lật trang. Trang kết quả đầy
đủ, nếu sau này có, sẽ là endpoint riêng.

### Các loại (`types`)

| `type` | Bảng | Tìm trong | Route (`src/config/nav.ts`) |
|---|---|---|---|
| `note` | `Note` | `title`, `body` | `/notes` |
| `task` | `Task` | `title`, `notes` | `/tasks` |
| `capture` | `Capture` | `title`, `excerpt`, `tags` | `/second-brain` |
| `email` | `EmailMessage` | `subject`, `fromName` | `/email` |
| `document` | `PersonalDocument` | `name` | `/documents` |
| `event` | `CalendarEvent` | `title`, `description` | `/calendar` |
| `goal` | `Goal` | `title`, `description` | `/goals` |

Bảy loại, khớp với bảy module có nội dung văn bản trong `navSections`. Giá trị
ngoài danh sách → `400`.

**Không có `expense` và `habit`** dù hai module đó có trong nav. Lý do: trường văn
bản của chúng (`Expense.note`, `Habit.name`) không phải thứ người ta tìm bằng từ
khoá — không ai gõ "cà phê" vào ô tìm kiếm toàn cục để tìm một giao dịch 35.000₫.
Chúng được tìm bằng bộ lọc và khoảng ngày trong chính module đó. Thêm chúng vào
đây là làm loãng kết quả bằng thứ không ai cần.

**`email` không tìm trong `body`**, khớp với `?q=` của [email.md](email.md). Toàn
văn thư làm kết quả nhiễu nặng: một chữ ký email chứa từ khoá là đủ để đẩy một thư
không liên quan lên đầu.

**`capture` tìm cả trong `tags`**, khớp với hành vi `CapturesBrowser` hiện tại —
xem [second-brain.md](second-brain.md#get-apicaptures).

### Response

Kết quả **nhóm theo loại**, không trộn lẫn thành một danh sách phẳng. Mỗi nhóm là
một khoá trong `data`:

```json
{
  "data": {
    "note": [ /* SearchResult[] */ ],
    "capture": [ /* SearchResult[] */ ]
  },
  "meta": { "total": 5 }
}
```

Nhóm theo loại thay vì trả mảng phẳng vì hai lý do. Client cần hiện tiêu đề nhóm
("Ghi chú", "Second Brain") và icon riêng cho từng loại — với mảng phẳng, client
phải tự gom lại, tức là làm hộ server một việc server đã biết. Và không có cách
nào so điểm liên quan giữa một ghi chú và một hoá đơn để xếp hạng chung cho có
nghĩa: `LIKE` chỉ trả về khớp/không khớp, không có điểm số.

**Chỉ loại có kết quả mới xuất hiện.** Không trả `"task": []` — khoá vắng mặt và
mảng rỗng cùng nghĩa "không có gì", và bỏ hẳn thì client lặp qua `data` là ra đúng
danh sách nhóm cần vẽ.

`meta.total` là **tổng số kết quả đã trả về** (sau khi cắt theo `limit`), không
phải tổng số bản ghi khớp trong database. Đếm chính xác đòi thêm một `COUNT(*)`
cho mỗi bảng — bảy truy vấn nữa cho một con số dùng để hiện "5 kết quả". Không
đáng.

**Mỗi kết quả (`SearchResult`):**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `type` | chuỗi | Một trong bảy loại. Lặp lại trong từng item để client không cần suy từ khoá nhóm. |
| `id` | chuỗi | ID bản ghi gốc, ví dụ `not_02`. |
| `title` | chuỗi | Tiêu đề hiển thị. Lấy từ trường tương ứng của từng bảng. |
| `excerpt` | chuỗi \| null | Đoạn ngắn quanh chỗ khớp, tối đa ~160 ký tự. `null` khi bản ghi không có trường văn bản dài. |
| `href` | chuỗi | Đường dẫn tới trang tương ứng. Xem bên dưới. |

Type này **chưa có trong `src/types/index.ts`** — cần thêm khi hiện thực:

```ts
export type SearchResultType =
  | "note" | "task" | "capture" | "email" | "document" | "event" | "goal";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  /** Đoạn quanh chỗ khớp, tối đa ~160 ký tự. */
  excerpt: string | null;
  /** Đường dẫn tới trang tương ứng, sinh ở server. */
  href: string;
}

/** Kết quả nhóm theo loại. Loại không có kết quả bị bỏ khỏi object. */
export type SearchResults = Partial<Record<SearchResultType, SearchResult[]>>;
```

### `href` lấy route từ `src/config/nav.ts`

`navSections` là **nguồn sự thật duy nhất cho điều hướng** — comment trong file
ghi rõ vậy. `href` của kết quả tìm kiếm phải dựng từ đó, **không hard-code chuỗi
`"/notes"`** ở tầng API. Đổi route trong nav mà tìm kiếm vẫn trỏ chỗ cũ là một
liên kết chết mà không test nào bắt được.

**Chỉ `note` có trang chi tiết.** Kiểm tra thư mục `src/app/(app)/`: chỉ có
`notes/[id]/page.tsx`. Mọi module khác chỉ có trang danh sách.

Vì vậy `href` có hai dạng:

| Loại | `href` | Vì sao |
|---|---|---|
| `note` | `/notes/not_02` | Có route `notes/[id]`. Trỏ thẳng vào bản ghi. |
| 6 loại còn lại | `/second-brain?id=cap_05` | Chưa có trang chi tiết. Trỏ trang danh sách kèm `?id=` để trang tự mở/cuộn tới bản ghi. |

**`?id=` là một hợp đồng, không phải một chuỗi trang trí.** Hiện **chưa trang nào
đọc nó** — không có `searchParams` nào trong các page hiện tại. Nghĩa là bấm vào
kết quả tìm kiếm sẽ mở đúng trang nhưng **không** chọn sẵn bản ghi. Đó là hành vi
chấp nhận được cho lần hiện thực đầu (người dùng vẫn tới đúng module), nhưng nó
**chưa xong**, và phải theo dõi như một đầu việc chứ không phải một đặc điểm.

Mỗi trang danh sách phải đọc `?id=` và tự xử lý: `EmailBrowser` chọn sẵn thư đó,
`CapturesBrowser` cuộn tới và làm nổi thẻ đó, `DocumentsBrowser` tương tự. Đây là
việc ở client, không phải ở API — API chỉ có trách nhiệm sinh `href` đúng.

Cách dựng, đặt ở một chỗ duy nhất:

```ts
import { navItems } from "@/config/nav";

const MODULE_BY_TYPE: Record<SearchResultType, string> = {
  note: "Ghi chú",
  task: "Công việc",
  capture: "Second Brain",
  email: "Email",
  document: "Tài liệu",
  event: "Lịch",
  goal: "Mục tiêu",
};

function baseHref(type: SearchResultType): string {
  const item = navItems.find((i) => i.label === MODULE_BY_TYPE[type]);
  if (!item) throw new Error(`Không tìm thấy nav item cho loại: ${type}`);
  return item.href;
}

export function resultHref(type: SearchResultType, id: string): string {
  const base = baseHref(type);
  return type === "note" ? `${base}/${id}` : `${base}?id=${encodeURIComponent(id)}`;
}
```

Tra bằng `label` là điểm yếu — đổi nhãn hiển thị sẽ làm hỏng ánh xạ, và `throw`
kia chỉ nổ lúc chạy. Nếu đụng vào `nav.ts`, thêm một trường ổn định thì tốt hơn:

```ts
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Khoá ổn định, không đổi khi đổi nhãn hiển thị. Dùng cho ánh xạ ở API. */
  key?: SearchResultType;
}
```

Lúc đó `baseHref` tra theo `key` và việc đổi nhãn tiếng Việt không phá gì.

**Response 200** — `GET /api/search?q=thói quen&types=note,capture&limit=5`

```json
{
  "data": {
    "note": [
      {
        "type": "note",
        "id": "not_02",
        "title": "Đọc lại Atomic Habits — Chương 3",
        "excerpt": "Ba lớp thay đổi hành vi: kết quả → quy trình → bản dạng. Thay đổi bền vững bắt đầu từ câu hỏi *mình muốn trở thành ai*, không phải…",
        "href": "/notes/not_02"
      }
    ],
    "capture": [
      {
        "type": "capture",
        "id": "cap_05",
        "title": "Atomic Habits — Chương 3: Ba lớp thay đổi",
        "excerpt": "Kết quả → quy trình → bản dạng. Thay đổi bền vững bắt đầu từ câu hỏi mình muốn trở thành ai.",
        "href": "/second-brain?id=cap_05"
      },
      {
        "type": "capture",
        "id": "cap_04",
        "title": "Xây dựng thói quen bền vững — Tập 42",
        "excerpt": "Khách mời chia sẻ cách gắn thói quen mới vào một thói quen đã có sẵn (habit stacking).",
        "href": "/second-brain?id=cap_04"
      },
      {
        "type": "capture",
        "id": "cap_06",
        "title": "Sơ đồ thói quen buổi sáng",
        "excerpt": "Ảnh chụp bảng trắng: chuỗi 5 việc từ lúc thức dậy đến khi ngồi vào bàn.",
        "href": "/second-brain?id=cap_06"
      }
    ]
  },
  "meta": { "total": 4 }
}
```

`not_02` khớp qua **tag** `"thói quen"` chứ không phải tiêu đề — tiêu đề của nó là
tiếng Anh. `cap_05` cũng vậy. Đó là lý do phải tìm cả trong `tags`: người dùng gõ
tiếng Việt cho một nội dung tiếng Anh vẫn tìm ra.

`Task` không có kết quả nào cho từ khoá này, và **khoá `"task"` không xuất hiện**
trong `data` — dù `types=note,capture` đã loại nó từ đầu, quy tắc vẫn là vậy kể cả
khi không lọc `types`.

**Lỗi**

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thiếu `q`, `q` ngắn hơn 2 ký tự sau khi trim, `types` chứa giá trị ngoài bảy loại, `limit` không phải số nguyên. Kèm `fields`. |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập. |
| 429 | `RATE_LIMITED` | Vượt giới hạn tần suất. Xem README. |

`limit` ngoài khoảng 1–20 thì **kẹp**, không báo lỗi.

`429` đáng chú ý ở đây hơn các module khác: ô tìm kiếm gõ tới đâu gọi tới đó
(search-as-you-type), nên một người gõ nhanh có thể chạm ngưỡng 100 request/phút
của README một cách hoàn toàn vô ý. **Client phải debounce** — 250–300ms sau lần
gõ cuối. Không debounce thì "thói quen" là 9 request cho một lần gõ, và mỗi
request quét bảy bảng.

## Phân tách theo người dùng

**Đây là quy tắc quan trọng nhất của module này**, và cũng là chỗ dễ hỏng nhất
trong toàn bộ API.

**Mọi truy vấn con — cả bảy — phải lọc theo `userId` lấy từ phiên đăng nhập.**

Bảy bảng, bảy điều kiện `where`, bảy cơ hội để quên một cái. Và **quên ở đây không
gây lỗi**: truy vấn vẫn chạy, vẫn trả kết quả, chỉ là kết quả gồm cả dữ liệu người
khác. Không có `404`, không có exception, không có gì trong log. Chỉ có ghi chú
của người lạ hiện trong ô tìm kiếm.

Các module khác lọc sai thì thường lộ ngay — danh sách hiện đầy thứ vô lý. Tìm
kiếm thì không: kết quả vốn đã thưa và trộn từ nhiều nguồn, nên vài dòng lạ trông
y hệt dữ liệu hợp lệ.

**Đừng viết bảy `where` bằng tay.** Một bảng ánh xạ, một chỗ chèn `userId`:

```ts
const SEARCHERS: Record<SearchResultType, (userId: string, q: string, limit: number) => Promise<SearchResult[]>> = {
  note: (userId, q, take) =>
    prisma.note.findMany({
      where: {
        userId, // ← Không bao giờ vắng mặt. Không bao giờ đến từ query param.
        OR: [{ title: { contains: q } }, { body: { contains: q } }],
      },
      select: { id: true, title: true, body: true },
      orderBy: { updatedAt: "desc" },
      take,
    }).then((rows) => rows.map(toNoteResult)),
  // ...sáu loại còn lại, cùng khuôn.
};
```

Cùng một khuôn cho cả bảy thì thiếu `userId` ở một cái là nhìn thấy được ngay khi
đọc. Bảy hàm viết rời rạc, mỗi cái một kiểu, thì không.

**`CaptureLink` không cần lọc** — module này không đụng tới nó. Nhưng `Milestone`
và `Attachment` cũng **không có `userId`**: nếu sau này mở rộng tìm kiếm sang
chúng, phải lọc qua quan hệ cha (`goal: { userId }`, `email: { userId }`). Xem
[README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).

## Giới hạn: `LIKE '%...%'` không dùng được index

**Đây là giới hạn kỹ thuật lớn nhất của module, và nó là cố hữu, không phải do
viết code kém.**

Truy vấn của tìm kiếm dịch ra SQL là:

```sql
SELECT id, title FROM Note
WHERE userId = ? AND (title LIKE '%thói quen%' OR body LIKE '%thói quen%');
```

`LIKE '%...%'` — có ký tự đại diện ở **đầu** — **không dùng được index B-tree**.
Index sắp xếp giá trị theo thứ tự từ trái sang: nó tìm nhanh được "mọi chuỗi bắt
đầu bằng `thói`", nhưng "mọi chuỗi **chứa** `thói` ở bất kỳ đâu" thì không có
thứ tự nào giúp được. Database buộc phải đọc **từng dòng** và kiểm tra từng cái.

`LIKE 'thói quen%'` (không có `%` đầu) thì dùng được index — nhưng nó chỉ khớp
tiêu đề *bắt đầu bằng* từ khoá, gần như vô dụng cho tìm kiếm thật.

**Hệ quả thực tế:**

- Chi phí tăng **tuyến tính** theo số bản ghi. Gấp đôi dữ liệu, gấp đôi thời gian.
- Nhân với **bảy bảng** mỗi lần gõ.
- Điều kiện `userId = ?` **có** dùng index, nên thực tế chỉ quét dữ liệu của một
  người — đây là thứ cứu module này ở quy mô hiện tại. Một người dùng cá nhân có
  vài trăm ghi chú, vài nghìn thư. Quét toàn bộ trong vài mili-giây.
- Vấn đề xuất hiện khi một người dùng tích luỹ hàng chục nghìn bản ghi — vài năm
  dùng thật, hoặc một lần đồng bộ hộp thư 20.000 thư.

**Không có cách nào sửa việc này bằng cách thêm index.** `@@index([userId, title])`
không giúp gì cho `LIKE '%...%'` trên `title`. Đây là giới hạn của cấu trúc dữ
liệu, không phải của cấu hình.

Thêm một vấn đề riêng của tiếng Việt: `LIKE` trong SQLite chỉ không phân biệt hoa
thường với **ASCII**. `'Thói' LIKE '%thói%'` → sai, vì `Th` có dấu ở ký tự sau và
SQLite không biết `Ó` và `ó` là một. Cách xử lý ở quy mô hiện tại: lưu thêm một
cột đã chuẩn hoá (hạ chữ thường + NFC), hoặc lọc trong bộ nhớ bằng `normalize()`
như client đang làm. Cả hai đều là vá tạm.

### Hướng đi: FTS5 (SQLite) hoặc `tsvector` (PostgreSQL)

Cả hai giải cùng một bài toán theo cùng một cách: xây **inverted index** — ánh xạ
từ *từ* → *danh sách bản ghi chứa từ đó*. Tra một từ khoá là tra một khoá trong
index, không phải quét bảng. Chi phí thôi phụ thuộc tuyến tính vào số bản ghi.

**SQLite FTS5** — dùng được ngay, không cần đổi database:

```sql
-- Bảng ảo, đồng bộ với Note qua trigger.
CREATE VIRTUAL TABLE note_fts USING fts5(
  title, body, content='Note', content_rowid='rowid',
  tokenize="unicode61 remove_diacritics 2"
);

SELECT rowid, snippet(note_fts, 1, '', '', '…', 20)
FROM note_fts WHERE note_fts MATCH 'thói quen';
```

Điểm cộng cho dự án này:

- `remove_diacritics 2` xử lý **dấu tiếng Việt** — "thoi quen" tìm ra "thói
  quen". Đây là thứ `LIKE` không bao giờ làm được, và nó có ích ngay cả khi tốc
  độ chưa thành vấn đề.
- Hàm `snippet()` sinh **`excerpt` quanh chỗ khớp** miễn phí — đúng cái trường
  `excerpt` cần, không phải tự cắt chuỗi.
- `bm25()` cho **điểm liên quan** để xếp hạng, thay vì thứ tự tuỳ ý của `LIKE`.

Cái giá: Prisma **không quản lý bảng ảo FTS5**. Phải viết migration thủ công, giữ
đồng bộ bằng trigger (`AFTER INSERT/UPDATE/DELETE` trên mỗi bảng gốc), và truy vấn
bằng `$queryRaw`. Bảy bảng là bảy bảng ảo và bảy bộ trigger. Đó là công việc thật,
không phải bật một cờ.

**PostgreSQL `tsvector`** — khi chuyển sang Postgres. Header của
`prisma/schema.prisma` ghi rõ việc chuyển chỉ cần đổi `provider` vì "không model
nào dùng tính năng riêng của SQLite". **Dựng FTS5 là phá vỡ điều đó** — cân nhắc
kỹ trước khi làm.

```sql
ALTER TABLE "Note" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(body,''))
  ) STORED;

CREATE INDEX note_search_idx ON "Note" USING GIN (search_vector);
```

Ưu điểm so với FTS5: cột sinh tự động, **không cần trigger**; GIN index là index
thật trên bảng thật, không phải bảng ảo song song; Prisma hỗ trợ sẵn qua
`fullTextSearch`. Postgres không có `simple` dictionary cho tiếng Việt, nhưng
`unaccent` xử lý được phần dấu.

**Khuyến nghị:**

1. **Bây giờ: dùng `LIKE`.** 12 capture, 6 ghi chú, 10 thư. Nó chạy trong vài
   mili-giây và code đọc được. Tối ưu hoá lúc này là tối ưu cho một vấn đề chưa
   tồn tại.
2. **Đo trước khi đổi.** Log thời gian của `/api/search`. Khi p95 vượt ~200ms,
   lúc đó mới có dữ liệu để chọn.
3. **Nếu vẫn ở SQLite khi đến ngưỡng: FTS5.** Bắt đầu từ `Note` và `Capture` —
   hai bảng có nhiều văn bản nhất và được tìm nhiều nhất. Không cần làm cả bảy.
4. **Nếu đã lên PostgreSQL: `tsvector` + GIN.** Ít việc hơn FTS5 và không phải
   duy trì trigger.
5. **Đừng dựng Elasticsearch/Meilisearch cho một app cá nhân.** Thêm một dịch vụ
   phải chạy, phải đồng bộ, phải vận hành — để tìm trong vài nghìn dòng chữ.

Dù chọn hướng nào, **shape của response ở trên không đổi**. Đó là điểm của việc
đặc tả nó tách khỏi cách hiện thực: đổi `LIKE` sang FTS5 là thay ruột của
`SEARCHERS`, client không biết gì.

## Quy tắc nghiệp vụ

1. **Mọi truy vấn con phải lọc theo `userId` từ phiên.** Bảy bảng, bảy lần. Quên
   một lần là rò dữ liệu người khác, và không có lỗi nào báo. Xem
   [mục riêng](#phân-tách-theo-người-dùng).
2. **`q` bắt buộc, tối thiểu 2 ký tự** sau khi trim. Thiếu hoặc ngắn hơn → `400`.
3. **`limit` là giới hạn mỗi loại**, không phải tổng. Mặc định `5`, kẹp ở 1–20.
4. **Kết quả nhóm theo loại.** Loại không có kết quả bị **bỏ khỏi** `data`, không
   trả mảng rỗng.
5. **`href` dựng từ `navItems`** trong `src/config/nav.ts`, không hard-code. Chỉ
   `note` có trang chi tiết (`/notes/:id`); các loại khác trỏ trang danh sách kèm
   `?id=`.
6. **`types` chỉ nhận bảy giá trị** đã liệt kê. Giá trị lạ → `400`, không bỏ qua
   im lặng — client gõ sai `types=notes` (thừa `s`) mà nhận `200` với kết quả
   thiếu là bug rất khó tìm.
7. **`meta.total` là số kết quả đã trả**, không phải số bản ghi khớp trong
   database.
8. **So khớp không phân biệt hoa thường và chuẩn hoá NFC**, khớp với `normalize()`
   mà client đang dùng ở mọi browser component.
9. **Không có tác dụng phụ.** `GET` không ghi lịch sử tìm kiếm, không cập nhật gì.
   Không có bảng nào cho việc đó, và thêm nó nghĩa là mỗi lần gõ phím là một lần
   ghi database.
10. Tìm kiếm **không tạo thêm quyền truy cập**. Thứ gì người dùng không thấy được
    qua API của module đó thì không được xuất hiện ở đây.

## Ghi chú khi hiện thực

- **Chạy bảy truy vấn song song, không tuần tự.** Chúng độc lập hoàn toàn:

  ```ts
  const types = parseTypes(searchParams.get("types")); // Mặc định: cả bảy.
  const results = await Promise.all(
    types.map(async (type) => [type, await SEARCHERS[type](session.userId, q, limit)] as const),
  );
  const data = Object.fromEntries(results.filter(([, rows]) => rows.length > 0));
  ```

  Tuần tự thì tổng thời gian là tổng của bảy; song song thì là cái chậm nhất.
  `.filter()` ở cuối là chỗ thực thi quy tắc 4 — một dòng, một chỗ, không rải rác.

- **`?types=` giúp giảm tải thật sự.** Ô Topbar có thể chỉ hỏi
  `types=note,task,capture` cho gợi ý tức thời, rồi hỏi đủ bảy loại khi người
  dùng nhấn Enter. Ba truy vấn thay vì bảy cho mỗi lần gõ.

- **Bảy truy vấn song song trên một kết nối SQLite là bảy truy vấn tuần tự.**
  SQLite chỉ có một writer nhưng nhiều reader; với WAL mode thì đọc song song
  được. Không có WAL thì `Promise.all` chỉ là ảo giác song song. Bật
  `PRAGMA journal_mode=WAL` — nên bật sẵn cho mọi lý do khác nữa.

- **Cắt `excerpt` quanh chỗ khớp, không phải từ đầu chuỗi.** `body.slice(0, 160)`
  thường không chứa từ khoá, và người dùng nhìn kết quả không hiểu vì sao nó khớp.

  ```ts
  function excerptAround(text: string, q: string, radius = 70): string {
    const i = normalize(text).indexOf(normalize(q));
    if (i === -1) return text.slice(0, 160).trim() + (text.length > 160 ? "…" : "");
    const start = Math.max(0, i - radius);
    const end = Math.min(text.length, i + q.length + radius);
    return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  }
  ```

  `i === -1` xảy ra thật: khớp có thể nằm ở `tags` hoặc `title` chứ không ở `body`
  — như `not_02` trong ví dụ trên. Fallback về đầu chuỗi là đúng cho trường hợp
  đó. Nếu chuyển sang FTS5, `snippet()` thay thế toàn bộ hàm này.

- **`excerpt` là `null` khi bảng không có trường văn bản dài.**
  `PersonalDocument` chỉ có `name` — không có gì để trích. Đừng nhồi tên file vào
  `excerpt` cho có; `null` là câu trả lời trung thực và client tự biết không vẽ
  dòng thứ hai.

- **`tags` phải `JSON.parse` trước khi tìm** với `Note` và `Capture`. Nhưng
  `tags LIKE '%thói quen%'` trên chuỗi JSON thô sẽ khớp cả `"thói quen tốt"` —
  cùng vấn đề với `?tag=` ở
  [documents.md](documents.md#ghi-chú-khi-hiện-thực). Ở đây thì **chấp nhận
  được**: tìm kiếm vốn là khớp một phần, và khớp `"thói quen tốt"` khi gõ "thói
  quen" đúng là điều người dùng muốn. Đây là chỗ hiếm hoi mà `LIKE` trên JSON thô
  cho ra hành vi đúng — nhưng nó **không** đúng cho bộ lọc `?tag=` cần khớp chính
  xác. Đừng dùng chung một hàm cho hai chỗ.

- **`Task.notes` và `Note.body` là hai trường khác nhau, tên gần giống nhau.**
  `Task` có `title` + `notes`; `Note` có `title` + `body`. Nhầm hai cái này thì
  Prisma sẽ báo lỗi biên dịch — nhưng chỉ khi dùng `select` tường minh.

- **`EmailMessage` có `preview` sẵn** — dùng nó làm `excerpt` thay vì cắt `body`.
  Nó tồn tại đúng cho mục đích này.

- **`Capture` và `EmailMessage` có thể trả về cùng một nội dung hai lần.**
  `cap_08` là `eml_03` đã lưu vào Second Brain — tìm "Deep Work" sẽ ra cả hai.
  **Đó là đúng**: chúng là hai bản ghi ở hai module, và người dùng có thể muốn tới
  bất kỳ cái nào. Nhóm theo loại làm chuyện này rõ ràng thay vì trông như lỗi trùng
  lặp. Đừng khử trùng.

- **Rate limit chặt hơn mặc định.** README cho 100 request/phút/người dùng cho
  nhóm "còn lại". Với search-as-you-type, cân nhắc một ngưỡng riêng cho
  `/api/search` — hoặc dựa vào debounce ở client và giữ nguyên. Nếu chọn dựa vào
  client, nhớ rằng client không phải chỗ để thực thi giới hạn: ai cũng gọi thẳng
  API bằng `curl` được. Xem [README.md](README.md#kiểm-tra-dữ-liệu).

- **Log thời gian truy vấn ngay từ đầu.** Đây là endpoint duy nhất mà hiệu năng sẽ
  xấu đi âm thầm theo thời gian — nó vẫn trả kết quả đúng, chỉ chậm dần. Không có
  số đo thì không ai biết khi nào đến lúc chuyển sang FTS5, cho tới khi người dùng
  than.

- **Response không trả trường nào ngoài bốn trường của `SearchResult`.** Cám dỗ
  lớn là nhét cả bản ghi vào cho client "khỏi gọi lại". Đừng: mỗi bảng một shape
  khác nhau, client sẽ phải phân nhánh theo `type` để đọc, và mọi cột nhạy cảm
  (`storageKey`, `passwordHash`) đều chỉ cách một lần `include` bất cẩn. Bốn
  trường, cùng một shape cho cả bảy loại.
