/**
 * Kiểu dữ liệu dùng chung cho toàn ứng dụng.
 *
 * Các kiểu này là "hợp đồng" giữa UI và API: khi tầng API được nối vào
 * (xem docs/api/), response phải khớp đúng shape ở đây. Prisma model trong
 * prisma/schema.prisma được thiết kế để map 1-1 với các kiểu này.
 */

// ---------------------------------------------------------------------------
// Người dùng & xác thực
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Session {
  user: User;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Lịch
// ---------------------------------------------------------------------------

/** Màu chấm sự kiện — cố định thành tập hữu hạn để UI luôn nhất quán. */
export type EventColor = "brand" | "clay" | "violet" | "sage" | "sand";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  /** ISO 8601. Với sự kiện cả ngày, phần giờ được bỏ qua. */
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
  color: EventColor;
}

// ---------------------------------------------------------------------------
// Công việc
// ---------------------------------------------------------------------------

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  projectId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  color: EventColor;
}

// ---------------------------------------------------------------------------
// Ghi chú
// ---------------------------------------------------------------------------

export interface Note {
  id: string;
  title: string;
  /** Nội dung dạng Markdown. */
  body: string;
  tags: string[];
  pinned: boolean;
  color: EventColor;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mục tiêu
// ---------------------------------------------------------------------------

export type GoalStatus = "active" | "done" | "paused";
/** Khung thời gian của mục tiêu. */
export type GoalHorizon = "quarter" | "year" | "life";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  horizon: GoalHorizon;
  /** Giá trị hiện tại / mục tiêu — dùng để tính % hoàn thành. */
  progressCurrent: number;
  progressTarget: number;
  /** Đơn vị của progress, ví dụ "cuốn sách", "km", "%". */
  unit: string;
  dueAt: string | null;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
}

// ---------------------------------------------------------------------------
// Chi tiêu
// ---------------------------------------------------------------------------

export type ExpenseKind = "expense" | "income";

export interface ExpenseCategory {
  id: string;
  name: string;
  color: EventColor;
  /** Hạn mức tháng, null nghĩa là không đặt hạn mức. */
  monthlyBudget: number | null;
}

export interface Expense {
  id: string;
  /** Số tiền dương, đơn vị VND. Chiều tiền do `kind` quyết định. */
  amount: number;
  kind: ExpenseKind;
  note: string | null;
  categoryId: string;
  spentAt: string;
}

// ---------------------------------------------------------------------------
// Thói quen
// ---------------------------------------------------------------------------

export interface Habit {
  id: string;
  name: string;
  /** Tên icon trong lucide-react, ví dụ "BookOpen". */
  icon: string;
  color: EventColor;
  /** Số ngày cần hoàn thành mỗi tuần, ví dụ 7 nghĩa là mục tiêu 7/7. */
  targetPerWeek: number;
  /** Đã lưu trữ — mặc định không trả về trong danh sách. Null nghĩa là đang theo. */
  archivedAt: string | null;
  createdAt: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  /** Ngày dạng "YYYY-MM-DD" — mỗi thói quen tối đa 1 entry/ngày. */
  date: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * Thư mục thật của một email — đây là giá trị được lưu xuống database.
 *
 * Chú ý: "starred" KHÔNG có ở đây. Gắn sao là cờ `starred` riêng, lọc xuyên
 * thư mục. Nếu gộp nó vào đây, một thư được gắn sao sẽ bị ghi `folder:
 * "starred"` và biến mất khỏi mọi thư mục thật.
 */
export type MailFolder = "inbox" | "sent" | "archive" | "trash";

/**
 * Mục đang chọn ở cột thư mục — trạng thái giao diện, không phải trường dữ liệu.
 * Gồm các thư mục thật cộng thêm "starred" là một bộ lọc xuyên thư mục.
 */
export type MailboxView = MailFolder | "starred";

export interface EmailMessage {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  /** Đoạn xem trước ngắn, hiện trong danh sách. */
  preview: string;
  body: string;
  folder: MailFolder;
  read: boolean;
  starred: boolean;
  receivedAt: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  /** Kích thước byte. */
  size: number;
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Tài liệu cá nhân
// ---------------------------------------------------------------------------

export type DocumentKind =
  | "pdf"
  | "image"
  | "video"
  | "sheet"
  | "doc"
  | "other";

export interface PersonalDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  size: number;
  folderId: string | null;
  tags: string[];
  /** Ngày hết hạn — dùng cho hộ chiếu, bảo hiểm, hợp đồng. */
  expiresAt: string | null;
  createdAt: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  color: EventColor;
}

// ---------------------------------------------------------------------------
// Second Brain
// ---------------------------------------------------------------------------

/** 7 loại nội dung người dùng có thể lưu vào Second Brain. */
export type CaptureType =
  | "note"
  | "bookmark"
  | "video"
  | "podcast"
  | "email"
  | "document"
  | "image";

/**
 * Một "capture" là bất kỳ thứ gì được lưu vào Second Brain.
 * Đây là bảng trung tâm — mọi loại nội dung đều quy về shape này để có thể
 * tìm kiếm, gắn tag và liên kết với nhau trong cùng một đồ thị.
 */
export interface Capture {
  id: string;
  type: CaptureType;
  title: string;
  /** Tóm tắt hoặc trích đoạn — thứ hiện trên thẻ. */
  excerpt: string | null;
  /** Nguồn gốc: URL với bookmark/video/podcast, null với note tự viết. */
  sourceUrl: string | null;
  /** Tên nguồn hiển thị, ví dụ "YouTube", "Spotify". */
  sourceName: string | null;
  tags: string[];
  /** Đánh dấu là node quan trọng — hiện có ngôi sao trong graph. */
  starred: boolean;
  createdAt: string;
  /** ID của các capture liên kết — cạnh vô hướng trong đồ thị. */
  linkedIds: string[];
}

/** Node đã tính sẵn toạ độ để vẽ graph. */
export interface GraphNode {
  id: string;
  label: string;
  /** Toạ độ tương đối 0–100, quy ra % trong SVG viewBox. */
  x: number;
  y: number;
  starred: boolean;
  color: EventColor;
  /** Node phụ (chấm nhỏ trên cạnh) hay node chính (thẻ bo tròn). */
  variant: "primary" | "secondary" | "dot";
}

export interface GraphEdge {
  from: string;
  to: string;
  /** Nét liền cho liên kết mạnh, nét đứt cho liên kết yếu/gợi ý. */
  strength: "strong" | "weak";
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// Tiện ích chung cho API
// ---------------------------------------------------------------------------

/** Bọc mọi response thành công của API. Xem docs/api/README.md. */
export interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    /** Lỗi theo từng field, dùng cho form validation. */
    fields?: Record<string, string>;
  };
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
