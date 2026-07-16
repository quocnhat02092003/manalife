# Email API

> **Trạng thái: chưa hiện thực.** Xem [README.md](README.md) cho quy ước chung.

Module này quản lý hộp thư của người dùng: đọc, gắn sao, chuyển thư mục, xoá và
lưu một thư vào Second Brain. Map tới model `EmailMessage` và `Attachment` trong
`prisma/schema.prisma`, shape response khớp `EmailMessage` trong
`src/types/index.ts`.

Các ví dụ bên dưới lấy từ `src/lib/mock/email.ts`, neo vào ngày `2026-07-15`
(mock sinh ngày tương đối so với "hôm nay").

## Tổng quan endpoint

| Method | Path                            | Mô tả                                                   |
| ------ | ------------------------------- | ------------------------------------------------------- |
| GET    | `/api/emails`                   | Danh sách thư, lọc theo thư mục / sao / trạng thái đọc. |
| GET    | `/api/emails/:id`               | Chi tiết một thư, kèm tệp đính kèm.                     |
| PATCH  | `/api/emails/:id`               | Đổi `read`, `starred` hoặc `folder`.                    |
| DELETE | `/api/emails/:id`               | Xoá vĩnh viễn. Chỉ áp dụng cho thư đã ở thùng rác.      |
| POST   | `/api/emails/:id/save-to-brain` | Tạo một `Capture` loại `email` từ thư này.              |

Không có `POST /api/emails`. Xem [Giới hạn hiện tại](#giới-hạn-hiện-tại-không-có-imapsmtp).

## `starred` không phải một thư mục

**Đây là điểm dễ hiểu sai nhất của module này. Đọc kỹ trước khi hiện thực.**

Cột `folder` chỉ nhận **bốn** giá trị:

```
inbox | sent | archive | trash
```

`starred` **không** nằm trong danh sách trên. Nó là một cột `Boolean` riêng, độc
lập hoàn toàn với `folder`. Một thư vừa nằm ở `inbox` vừa có `starred: true` —
xem `eml_01` trong mock.

Vì vậy "Có gắn sao" ở cột trái giao diện **không phải một thư mục**, mà là bộ lọc
**xuyên thư mục**: `GET /api/emails?starred=true`. Nó gom thư có sao từ `inbox`,
`sent` và `archive` lại một chỗ. Không có thư nào "nằm trong" thư mục starred, và
`PATCH { "folder": "starred" }` là **không hợp lệ** → `400 VALIDATION_FAILED`.

Hệ quả cụ thể khi hiện thực:

- Gắn sao là `PATCH { "starred": true }`, **không** phải chuyển thư mục. Thư vẫn
  ở nguyên `inbox`.
- Bỏ sao một thư không làm nó biến mất khỏi `inbox` — nó chưa bao giờ rời đi.
- Đếm số thư của "Có gắn sao" là `count(starred = true AND folder != 'trash')`,
  không phải `count(folder = 'starred')` — truy vấn thứ hai luôn trả về 0.

**Cạm bẫy trong `src/types/index.ts`:** type `MailFolder` hiện đang là

```ts
export type MailFolder = "inbox" | "starred" | "sent" | "archive" | "trash";
```

Type này có `"starred"` vì UI dùng chung nó làm khoá cho mục đang chọn ở cột trái
(xem `folders` và `messagesInFolder` trong `src/components/email/folder-list.tsx`).
Nó là **giá trị của UI, không phải giá trị của cột `folder`** —
`prisma/schema.prisma` ghi rõ điều này trong comment của `EmailMessage.folder`.

Server **không được** dùng `MailFolder` để validate `folder`. Cần một type hẹp
hơn cho tầng dữ liệu, ví dụ:

```ts
/** Giá trị hợp lệ của cột EmailMessage.folder. Không có "starred". */
export type MailFolderValue = "inbox" | "sent" | "archive" | "trash";
/** Mục chọn ở cột trái — gồm cả bộ lọc ảo "starred". */
export type MailFolder = MailFolderValue | "starred";
```

Nếu bỏ qua chỗ này, `PATCH { "folder": "starred" }` sẽ lọt qua validation và ghi
vào database một giá trị mà không truy vấn nào đọc được — thư biến mất khỏi mọi
thư mục.

## GET /api/emails

Trả về thư của người dùng đang đăng nhập, mới nhất lên đầu.

**Query params**

| Tham số   | Kiểu      | Bắt buộc | Mặc định      | Mô tả                                                                                               |
| --------- | --------- | -------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `folder`  | chuỗi     | không    | —             | `inbox` \| `sent` \| `archive` \| `trash`. Vắng mặt nghĩa là mọi thư mục. **Không nhận `starred`.** |
| `starred` | boolean   | không    | —             | `true` chỉ lấy thư có sao, `false` chỉ lấy thư không sao. Vắng mặt nghĩa là không lọc theo sao.     |
| `read`    | boolean   | không    | —             | `false` chỉ lấy thư chưa đọc. Vắng mặt nghĩa là không lọc.                                          |
| `q`       | chuỗi     | không    | —             | Tìm trong `subject` và `fromName`. Không tìm trong `body`.                                          |
| `sort`    | chuỗi     | không    | `-receivedAt` | Cho phép: `receivedAt`, `subject`. Thêm `-` để giảm dần.                                            |
| `page`    | số nguyên | không    | `1`           | Xem README.                                                                                         |
| `perPage` | số nguyên | không    | `20`          | Xem README.                                                                                         |

Ba bộ lọc `folder`, `starred`, `read` kết hợp bằng `AND`. Chúng độc lập nhau:
`?folder=archive&starred=true` là hợp lệ và có nghĩa — thư có sao trong lưu trữ.

**Quy tắc `starred=true` không kèm `folder`:** khi client gửi `?starred=true` mà
không chỉ định `folder`, server **loại `trash` ra**. Thư đã vứt đi mà vẫn hiện ở
"Có gắn sao" thì thùng rác không còn ý nghĩa. Nếu thực sự cần xem thư có sao
trong thùng rác, gửi cả hai: `?folder=trash&starred=true` — lúc đó `folder` được
chỉ định tường minh nên server tôn trọng nó. Đây đúng là hành vi của
`messagesInFolder()` ở client hiện tại.

`q` so khớp không phân biệt hoa thường và chuẩn hoá Unicode NFC — xem
`normalize()` trong `src/components/email/email-browser.tsx`. Server phải làm
tương đương, nếu không "Linh" và "linh" sẽ ra kết quả khác nhau.

**Response 200** — `GET /api/emails?starred=true`

Hai thư dưới đây có sao nhưng nằm ở hai trạng thái đọc khác nhau, và **cả hai đều
thuộc `folder: "inbox"`** — minh hoạ đúng điểm nêu ở trên.

```json
{
  "data": [
    {
      "id": "eml_01",
      "subject": "Đề xuất dự án — bản chỉnh sửa cuối",
      "fromName": "Trần Khánh Linh",
      "fromEmail": "linh.tran@studio.vn",
      "preview": "Mình đã rà lại phần ngân sách theo góp ý của bạn. Xem giúp mình phần timeline nhé…",
      "body": "Chào Thuận,\n\nMình đã rà lại phần ngân sách theo góp ý của bạn hôm trước. Có hai thay đổi chính:\n\n1. Giảm chi phí thiết kế xuống 20% nhờ tái sử dụng design system sẵn có.\n2. Dời mốc bàn giao sang cuối tháng để có thời gian test kỹ hơn.\n\nBạn xem giúp mình phần timeline trong file đính kèm nhé. Nếu ổn thì mình gửi cho khách vào thứ Sáu.\n\nCảm ơn bạn,\nLinh",
      "folder": "inbox",
      "read": false,
      "starred": true,
      "receivedAt": "2026-07-15T09:42:00.000Z",
      "attachments": [
        {
          "id": "att_01",
          "name": "de-xuat-du-an-v3.pdf",
          "size": 2411520,
          "mimeType": "application/pdf"
        }
      ]
    },
    {
      "id": "eml_03",
      "subject": "Bản tin tuần: 5 bài viết về Deep Work",
      "fromName": "Productive Weekly",
      "fromEmail": "hello@productiveweekly.com",
      "preview": "Tuần này chúng tôi tổng hợp 5 bài viết đáng đọc nhất về sự tập trung sâu…",
      "body": "Chào bạn,\n\nTuần này chúng tôi tổng hợp 5 bài viết đáng đọc nhất về sự tập trung sâu:\n\n1. Vì sao đa nhiệm là một huyền thoại\n2. Thiết kế môi trường làm việc không xao nhãng\n3. Time-boxing: kỹ thuật đơn giản mà hiệu quả\n4. Nghỉ ngơi cũng là một phần của công việc\n5. Đo lường sự tập trung như thế nào\n\nChúc bạn một tuần hiệu quả!",
      "folder": "inbox",
      "read": true,
      "starred": true,
      "receivedAt": "2026-07-14T07:00:00.000Z",
      "attachments": []
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 2, "totalPages": 1 }
}
```

**Lỗi**

| HTTP | `code`              | Khi nào                                                                                                                  |
| ---- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 400  | `VALIDATION_FAILED` | `folder` ngoài 4 giá trị hợp lệ (kể cả `starred`), `starred`/`read` không phải boolean, `sort` ngoài danh sách cho phép. |
| 401  | `UNAUTHENTICATED`   | Chưa đăng nhập.                                                                                                          |

## GET /api/emails/:id

Chi tiết một thư, kèm toàn bộ tệp đính kèm.

**Query params** — không có.

**Response 200**

```json
{
  "data": {
    "id": "eml_04",
    "subject": "Hoá đơn tháng — Gói Pro",
    "fromName": "Figma",
    "fromEmail": "billing@figma.com",
    "preview": "Cảm ơn bạn đã sử dụng dịch vụ. Hoá đơn tháng này là 15 USD…",
    "body": "Xin chào,\n\nCảm ơn bạn đã sử dụng Figma. Hoá đơn tháng này:\n\nGói Professional — 15 USD\nĐã thanh toán bằng thẻ kết thúc 4242.\n\nXem chi tiết trong file đính kèm.",
    "folder": "inbox",
    "read": true,
    "starred": false,
    "receivedAt": "2026-07-13T03:20:00.000Z",
    "attachments": [
      {
        "id": "att_02",
        "name": "figma-invoice-07.pdf",
        "size": 184320,
        "mimeType": "application/pdf"
      }
    ]
  }
}
```

`GET` **không** tự đánh dấu đã đọc. Client mở thư rồi tự gọi `PATCH` — xem quy
tắc 4.

**Lỗi**

| HTTP | `code`            | Khi nào                                    |
| ---- | ----------------- | ------------------------------------------ |
| 401  | `UNAUTHENTICATED` | Chưa đăng nhập.                            |
| 404  | `NOT_FOUND`       | Không tồn tại, hoặc là thư của người khác. |

## PATCH /api/emails/:id

Đổi trạng thái một thư. Đây là endpoint ghi duy nhất của module — mọi thao tác
trên giao diện (gắn sao, lưu trữ, bỏ vào thùng rác, đánh dấu đã đọc) đều quy về
đây.

**Request body** — mọi trường đều tuỳ chọn, nhưng phải có ít nhất một.

| Trường    | Kiểu    | Mô tả                                                   |
| --------- | ------- | ------------------------------------------------------- |
| `read`    | boolean | Đã đọc hay chưa.                                        |
| `starred` | boolean | Có gắn sao hay không. **Không liên quan tới `folder`.** |
| `folder`  | chuỗi   | `inbox` \| `sent` \| `archive` \| `trash`.              |

Các trường nội dung (`subject`, `body`, `fromName`, `fromEmail`, `preview`,
`receivedAt`, `attachments`) **không sửa được**. Thư đến từ bên ngoài; sửa nội
dung thư của người khác gửi cho mình là vô nghĩa. Gửi lên → bỏ qua im lặng, hoặc
`400` nếu muốn chặt chẽ hơn — chọn một và làm nhất quán.

**Bỏ vào thùng rác là `PATCH`, không phải `DELETE`:**

```json
{ "folder": "trash" }
```

Thư chỉ đổi thư mục, bản ghi vẫn còn nguyên, phục hồi được bằng cách `PATCH`
ngược lại `{ "folder": "inbox" }`. Đây là điều giao diện đang làm — nút "Xoá"
trong `message-view.tsx` gọi `onDelete` và handler của nó là
`patchMessage(id, { folder: "trash" })`, không xoá gì cả.

**Response 200** — `PATCH /api/emails/eml_02` với body `{ "read": true }`

```json
{
  "data": {
    "id": "eml_02",
    "subject": "Xác nhận lịch khám sức khoẻ định kỳ",
    "fromName": "Phòng khám Hoà Hảo",
    "fromEmail": "no-reply@hoahao.vn",
    "preview": "Lịch hẹn của bạn đã được xác nhận vào 8:00 sáng. Vui lòng nhịn ăn trước 8 tiếng…",
    "body": "Kính chào anh/chị,\n\nLịch hẹn khám sức khoẻ định kỳ của anh/chị đã được xác nhận:\n\nThời gian: 8:00 sáng\nĐịa điểm: 254 Hoà Hảo, Quận 10\n\nLưu ý: vui lòng nhịn ăn trước 8 tiếng để kết quả xét nghiệm chính xác.\n\nTrân trọng.",
    "folder": "inbox",
    "read": true,
    "starred": false,
    "receivedAt": "2026-07-15T08:05:00.000Z",
    "attachments": []
  }
}
```

**Lỗi**

| HTTP | `code`              | Khi nào                                                                                                                      |
| ---- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 400  | `VALIDATION_FAILED` | `folder` ngoài 4 giá trị hợp lệ — **`"starred"` rơi vào đây**. `read`/`starred` không phải boolean. Body rỗng. Kèm `fields`. |
| 400  | `MALFORMED_JSON`    | Body không phải JSON hợp lệ.                                                                                                 |
| 401  | `UNAUTHENTICATED`   | Chưa đăng nhập.                                                                                                              |
| 404  | `NOT_FOUND`         | Không tồn tại, hoặc là thư của người khác.                                                                                   |

## DELETE /api/emails/:id

Xoá **vĩnh viễn** một thư và toàn bộ tệp đính kèm của nó. Không hoàn tác được.

**Chỉ dùng cho thư đã ở thùng rác.** Gọi `DELETE` trên thư đang ở `inbox`, `sent`
hoặc `archive` → `422 UNPROCESSABLE`. Lý do: xoá một bước từ hộp thư đến là mất
dữ liệu không phục hồi được do một cú nhấp nhầm. Bắt buộc đi qua `trash` trước
thì người dùng luôn có một bước để đổi ý.

Đây là endpoint của nút "Xoá vĩnh viễn" / "Dọn thùng rác", **không** phải nút
"Xoá" trong khung đọc thư — nút đó gọi `PATCH { "folder": "trash" }`.

**Response 200**

```json
{ "data": { "id": "eml_10", "deleted": true } }
```

(`eml_10` — "Khảo sát mức độ hài lòng" — là thư duy nhất đang ở `trash` trong
mock.)

**Lỗi**

| HTTP | `code`            | Khi nào                                         |
| ---- | ----------------- | ----------------------------------------------- |
| 401  | `UNAUTHENTICATED` | Chưa đăng nhập.                                 |
| 404  | `NOT_FOUND`       | Không tồn tại, hoặc là thư của người khác.      |
| 422  | `UNPROCESSABLE`   | Thư chưa ở `trash`. Chuyển vào thùng rác trước. |

## POST /api/emails/:id/save-to-brain

**Tính năng cốt lõi của module** — nút "Lưu vào Second Brain" ở chân khung đọc
thư (`src/components/email/message-view.tsx`).

Tạo một bản ghi **`Capture` mới** với `type: "email"` từ nội dung thư. Sau khi
lưu, thư trở thành một node trong đồ thị tri thức, tìm kiếm được cùng ghi chú và
bookmark, và liên kết được với capture khác — xem
[second-brain.md](second-brain.md).

Thư **không bị đổi gì cả**: không chuyển thư mục, không gắn sao, không đánh dấu
đã đọc. Endpoint này chỉ đọc thư và ghi sang bảng `Capture`.

**Request body** — không có. Toàn bộ nội dung suy ra từ thư.

**Ánh xạ trường** — `EmailMessage` → `Capture`:

| Trường `Capture` | Lấy từ           | Ghi chú                                                         |
| ---------------- | ---------------- | --------------------------------------------------------------- |
| `type`           | —                | Luôn là `"email"`.                                              |
| `title`          | `email.subject`  | Nguyên văn.                                                     |
| `excerpt`        | `email.preview`  | Dùng `preview` chứ không phải `body` — `body` quá dài cho thẻ.  |
| `sourceUrl`      | —                | Luôn `null`. Thư không có URL công khai.                        |
| `sourceName`     | `email.fromName` | Tên người/tổ chức gửi.                                          |
| `tags`           | —                | `[]`. Người dùng tự gắn tag sau bằng `PATCH /api/captures/:id`. |
| `starred`        | —                | `false`. Sao của thư và sao của capture là hai thứ khác nhau.   |
| `userId`         | phiên đăng nhập  | Không lấy từ thư.                                               |

**Phải idempotent.** Gọi hai lần trên cùng một thư **không được** tạo hai capture.
Người dùng nhấn nút hai lần — vì lần đầu không thấy phản hồi, vì mạng chậm, vì
double-click — là chuyện bình thường, và hai bản sao y hệt nhau trong Second Brain
thì không ai xoá hộ được.

- Lần đầu → `201 Created`, kèm capture vừa tạo.
- Lần sau → `200 OK`, kèm **đúng capture đã tạo lần đầu**. Không tạo mới, không
  báo lỗi. Người dùng nhấn hai lần vẫn thấy đúng một thứ, và client không phải xử
  lý case đặc biệt nào.

**Response 201** — `POST /api/emails/eml_03/save-to-brain`

Đây chính là `cap_08` trong `src/lib/mock/second-brain.ts`: bản tin `eml_03` đã
được lưu vào Second Brain lúc `07:05`, năm phút sau khi nhận lúc `07:00`.

```json
{
  "data": {
    "id": "cap_08",
    "type": "email",
    "title": "Bản tin tuần: 5 bài viết về Deep Work",
    "excerpt": "Tổng hợp 5 bài đáng đọc về sự tập trung sâu — đã lưu để đọc lại vào cuối tuần.",
    "sourceUrl": null,
    "sourceName": "Productive Weekly",
    "tags": ["tập trung", "bản tin"],
    "starred": false,
    "createdAt": "2026-07-14T07:05:00.000Z",
    "linkedIds": []
  }
}
```

`excerpt` và `tags` trong `cap_08` khác giá trị sinh tự động vì người dùng đã sửa
lại sau khi lưu — endpoint này chỉ tạo bản nháp đầu tiên. Ngay sau khi tạo,
`excerpt` sẽ là `preview` của `eml_03` và `tags` là `[]`.

**Lỗi**

| HTTP | `code`            | Khi nào                                        |
| ---- | ----------------- | ---------------------------------------------- |
| 401  | `UNAUTHENTICATED` | Chưa đăng nhập.                                |
| 404  | `NOT_FOUND`       | Thư không tồn tại, hoặc là thư của người khác. |

## Tệp đính kèm

Không có endpoint riêng cho `Attachment`. Đính kèm là **quan hệ con** của thư và
luôn đi kèm trong response của `GET /api/emails/:id` và `GET /api/emails`.

| Trường     | Kiểu      | Ghi chú                                                            |
| ---------- | --------- | ------------------------------------------------------------------ |
| `id`       | chuỗi     | cuid.                                                              |
| `name`     | chuỗi     | Tên file gốc, ví dụ `de-xuat-du-an-v3.pdf`.                        |
| `size`     | số nguyên | **Đơn vị byte**, không phải KB/MB. `2411520` = 2,3 MB. Xem README. |
| `mimeType` | chuỗi     | Ví dụ `application/pdf`.                                           |

`Attachment.storageKey` có trong `prisma/schema.prisma` nhưng **không** có trong
type `Attachment` ở `src/types/index.ts` → **không trả ra response**. Nó là đường
dẫn nội bộ tới kho lưu trữ; lộ ra ngoài là mời người ta dò thẳng vào storage.

Định dạng lại `size` là việc của client — `formatFileSize()` trong
`src/lib/utils.ts`. API luôn trả số byte thô.

Xoá thư (`DELETE`) sẽ xoá đính kèm theo nhờ `onDelete: Cascade`. Nhưng **file
thật trong kho lưu trữ thì Prisma không xoá hộ** — xem ghi chú hiện thực.

## Quy tắc nghiệp vụ

1. **`starred` không phải một giá trị của `folder`.** `folder` chỉ có `inbox` |
   `sent` | `archive` | `trash`. "Có gắn sao" là bộ lọc `?starred=true` xuyên thư
   mục. Xem [mục riêng ở trên](#starred-không-phải-một-thư-mục) — đây là quy tắc
   quan trọng nhất của module.
2. **`?starred=true` không kèm `folder` thì loại `trash`.** Muốn xem thư có sao
   trong thùng rác phải gửi `folder=trash` tường minh.
3. **Bỏ vào thùng rác = `PATCH { "folder": "trash" }`**, không phải `DELETE`. Bản
   ghi còn nguyên, phục hồi được.
4. **`DELETE` = xoá vĩnh viễn, chỉ dùng cho thư đã ở `trash`.** Thư ở thư mục
   khác → `422`.
5. **`GET` không tự đánh dấu đã đọc.** Client mở thư rồi gọi
   `PATCH { "read": true }` riêng. Giữ `GET` không có tác dụng phụ để prefetch,
   reload hay mở hai tab không âm thầm đổi dữ liệu. Client hiện làm đúng vậy —
   xem `handleSelect()` trong `email-browser.tsx`.
6. **`POST /api/emails/:id/save-to-brain` phải idempotent.** Gọi lại trả `200`
   kèm capture cũ, không tạo bản thứ hai.
7. **Nội dung thư là bất biến.** Chỉ `read`, `starred`, `folder` sửa được.
8. **`size` của đính kèm là số nguyên byte.** Xem README.
9. Thư luôn thuộc đúng một người dùng. Không có chia sẻ, không có nhãn dùng chung
   — `EmailMessage` không có quan hệ nào ngoài `user` và `attachments`.
10. Không có nhãn (label) nhiều-nhiều như Gmail. Một thư nằm ở đúng một thư mục
    tại một thời điểm.

## Giới hạn hiện tại: không có IMAP/SMTP

**Model này hiện chỉ _lưu_ thư. Chưa có tích hợp máy chủ mail thật.**

`EmailMessage` là một bảng phẳng chứa thư đã có sẵn trong database. Không có gì
trong `prisma/schema.prisma` nối tới thế giới bên ngoài: không có thông tin tài
khoản IMAP, không có `messageId` của RFC 5322, không có `threadId`, không có
`uidValidity`, không có trạng thái đồng bộ.

Cụ thể, những thứ **chưa làm được**:

- **Nhận thư mới.** Không có tiến trình nào kéo thư từ máy chủ IMAP về. Dữ liệu
  vào bảng này chỉ có thể do seed hoặc nhập tay.
- **Gửi thư.** Không có endpoint `POST /api/emails`, không có SMTP. Nút "Trả lời"
  và "Chuyển tiếp" trong `message-view.tsx` hiện là giao diện chưa nối gì.
  `folder: "sent"` của `eml_07`, `eml_08` là dữ liệu mẫu, không phải thư đã gửi
  thật.
- **Đồng bộ hai chiều.** Gắn sao ở manalife không gắn sao trên Gmail, và ngược lại.
  Không có cột nào lưu trạng thái đã đồng bộ hay chưa.
- **Hội thoại (thread).** Mỗi thư đứng riêng. `eml_05` có tiêu đề bắt đầu bằng
  `"Re: "` nhưng đó chỉ là chuỗi ký tự, không có liên kết nào tới thư gốc.

Giá trị của module ở giai đoạn này nằm ở **`save-to-brain`**: biến thư thành node
trong Second Brain. Phần đó hoạt động đầy đủ với dữ liệu đang có.

Khi làm tích hợp thật, phần lớn công việc nằm ở schema chứ không ở API:
`EmailMessage` cần ít nhất `messageId` (duy nhất, để chống trùng khi đồng bộ
lại), `threadId`, và một bảng riêng cho thông tin tài khoản mail. Đặc tả này
không bao gồm phần đó.

## Ghi chú khi hiện thực

- **Hai index, hai truy vấn khác nhau.** `EmailMessage` có sẵn:

  ```prisma
  @@index([userId, folder, receivedAt])
  @@index([userId, starred])
  ```

  Index thứ nhất phục vụ "thư trong thư mục X, mới nhất trước": hai cột đầu là
  điều kiện bằng, cột cuối cho thứ tự — `ORDER BY receivedAt DESC` không tốn thêm
  bước sắp xếp nào.

  Index thứ hai phục vụ đúng bộ lọc `?starred=true`. Nó **không có** `receivedAt`,
  nên truy vấn thư có sao vẫn phải sắp xếp thủ công sau khi lọc. Với vài trăm thư
  có sao thì không đáng kể. Nếu sau này thành vấn đề, đổi thành
  `@@index([userId, starred, receivedAt])` — cùng lý do như index thứ nhất.

  ```ts
  // ?starred=true — bộ lọc xuyên thư mục, tự loại trash.
  const emails = await prisma.emailMessage.findMany({
    where: { userId: session.userId, starred: true, folder: { not: "trash" } },
    orderBy: { receivedAt: "desc" },
    include: { attachments: true },
  });
  ```

- **Validate `folder` bằng danh sách 4 phần tử, không dùng type `MailFolder`.**
  Cột này là `String` trong SQLite nên database không chặn gì cả. Nếu tái dùng
  `MailFolder` (đang có `"starred"`) để validate, giá trị `"starred"` sẽ lọt vào
  database và thư biến mất khỏi mọi thư mục — không truy vấn nào tìm thấy nó nữa.
  Xem [mục riêng ở trên](#starred-không-phải-một-thư-mục) cho cách tách type.

- **`save-to-brain` cần một khoá idempotent.** `Capture` hiện **không có cột nào
  trỏ ngược về `EmailMessage`** — không có `sourceId`, không có `emailId`. Nghĩa
  là hiện tại không có cách chắc chắn nào để biết "thư này đã lưu chưa".

  Ba lựa chọn, theo thứ tự ưu tiên:
  1. **Thêm cột `sourceId String?` vào `Capture`** kèm
     `@@unique([userId, type, sourceId])`. Đây là cách đúng: `INSERT` thứ hai bị
     database chặn, bắt lỗi `P2002` rồi trả về bản ghi cũ với `200`. Không có race
     condition vì ràng buộc do database giữ, không phải do code.
  2. Dò trùng bằng `type = "email" AND title = subject`. Không cần đổi schema
     nhưng sai khi hai thư khác nhau trùng tiêu đề — với bản tin hàng tuần thì
     chuyện này xảy ra liên tục.
  3. Không chống trùng. Đừng.

  Nếu chọn (1), nhớ để `sourceId` ngoài response — type `Capture` không có nó.

  **Đừng dò trùng bằng `findFirst` rồi `create` nếu không thấy.** Hai request
  song song sẽ cùng không thấy gì và cùng tạo — đúng cái phải tránh. Ràng buộc
  duy nhất ở database là thứ duy nhất chịu được đồng thời.

- **`DELETE` phải kiểm tra `folder` trước khi xoá**, không phải sau. Đọc thư ra
  bằng `findFirst` kèm `userId`, kiểm tra `folder === "trash"`, rồi mới `delete`.
  Không dùng `deleteMany({ where: { id, userId, folder: "trash" } })` một phát vì
  `count === 0` không phân biệt được ba trường hợp: không tồn tại (`404`), của
  người khác (`404`), và chưa ở trash (`422`).

- **Xoá thư không xoá file đính kèm khỏi kho lưu trữ.** `onDelete: Cascade` chỉ
  xoá dòng trong bảng `Attachment`; file mà `storageKey` trỏ tới vẫn nằm nguyên
  trên S3/R2/đĩa và không còn ai tham chiếu. Đọc `storageKey` **trước** khi xoá,
  rồi xoá file sau. Nếu xoá file thất bại thì ghi log và bỏ qua — đừng để giao
  dịch database rollback vì storage lỗi, thư đã xoá phải xoá thật.

- **Lọc theo `userId` từ phiên**, không bao giờ từ query param. Xem
  [README.md](README.md#phân-tách-dữ-liệu-theo-người-dùng).

- **Response không trả `createdAt`.** Cột này có trong Prisma model nhưng không có
  trong type `EmailMessage` — thứ có nghĩa với người dùng là `receivedAt`, còn
  `createdAt` chỉ là lúc dòng dữ liệu được ghi. Nhớ `select` đúng trường. Tương
  tự, `Attachment.storageKey` cũng không được trả ra.

- **`q` phải chuẩn hoá NFC và hạ chữ thường** cho khớp hành vi client. SQLite
  `LIKE` mặc định chỉ phân biệt hoa thường với ASCII — tiếng Việt có dấu sẽ không
  khớp như mong đợi. Chuẩn hoá cả từ khoá lẫn dữ liệu, hoặc lưu thêm cột đã chuẩn
  hoá nếu cần tìm nhanh. Xem thêm [search.md](search.md).
