import type { Capture, KnowledgeGraph } from "@/types";
import { at } from "./dates";

/**
 * Second Brain — mọi thứ người dùng lưu lại, quy về một shape chung.
 * Bảy loại: note, bookmark, video, podcast, email, document, image.
 *
 * BẤT BIẾN: `linkedIds` phải đối xứng — nếu A liệt kê B thì B phải liệt kê A.
 * Liên kết là vô hướng (xem model `CaptureLink` trong prisma/schema.prisma).
 * Dữ liệu lệch ở đây sẽ bị bê thẳng vào database khi viết seed.
 */
export const captures: Capture[] = [
  {
    id: "cap_01",
    type: "note",
    title: 'Ý tưởng nội dung: Series "Productive Week"',
    excerpt:
      "Mỗi thứ Hai đăng một bài ngắn về cách sắp xếp tuần làm việc. Tuần 1: chọn 3 việc quan trọng nhất.",
    sourceUrl: null,
    sourceName: null,
    tags: ["nội dung", "năng suất"],
    starred: false,
    createdAt: at(0, 10, 15),
    linkedIds: ["cap_04", "cap_07"],
  },
  {
    id: "cap_02",
    type: "bookmark",
    title: "The Only Productivity Advice You Need",
    excerpt:
      "Bài viết lập luận rằng mọi hệ thống năng suất đều quy về một điều: giảm số quyết định phải đưa ra mỗi ngày.",
    sourceUrl: "https://example.com/productivity-advice",
    sourceName: "Essays",
    tags: ["năng suất", "tư duy"],
    starred: true,
    createdAt: at(-1, 22, 10),
    linkedIds: ["cap_07", "cap_09"],
  },
  {
    id: "cap_03",
    type: "video",
    title: "How to Focus Deeply — Cal Newport",
    excerpt:
      "Bài nói 18 phút về deep work: tập trung sâu là kỹ năng có thể luyện, không phải tính cách bẩm sinh.",
    sourceUrl: "https://youtube.com/watch?v=example",
    sourceName: "YouTube",
    tags: ["tập trung", "deep work"],
    starred: true,
    createdAt: at(-2, 20, 45),
    linkedIds: ["cap_08", "cap_09"],
  },
  {
    id: "cap_04",
    type: "podcast",
    title: "Xây dựng thói quen bền vững — Tập 42",
    excerpt:
      "Khách mời chia sẻ cách gắn thói quen mới vào một thói quen đã có sẵn (habit stacking).",
    sourceUrl: "https://spotify.com/episode/example",
    sourceName: "Spotify",
    tags: ["thói quen", "sức khoẻ"],
    starred: false,
    createdAt: at(-3, 7, 30),
    linkedIds: ["cap_01", "cap_05", "cap_06"],
  },
  {
    id: "cap_05",
    type: "note",
    title: "Atomic Habits — Chương 3: Ba lớp thay đổi",
    excerpt:
      "Kết quả → quy trình → bản dạng. Thay đổi bền vững bắt đầu từ câu hỏi mình muốn trở thành ai.",
    sourceUrl: null,
    sourceName: null,
    tags: ["sách", "thói quen"],
    starred: true,
    createdAt: at(-1, 21, 40),
    linkedIds: ["cap_04", "cap_06"],
  },
  {
    id: "cap_06",
    type: "image",
    title: "Sơ đồ thói quen buổi sáng",
    excerpt: "Ảnh chụp bảng trắng: chuỗi 5 việc từ lúc thức dậy đến khi ngồi vào bàn.",
    sourceUrl: null,
    sourceName: null,
    tags: ["thói quen", "buổi sáng"],
    starred: false,
    createdAt: at(-4, 8, 0),
    linkedIds: ["cap_04", "cap_05", "cap_12"],
  },
  {
    id: "cap_07",
    type: "bookmark",
    title: "Time-boxing: kỹ thuật quản lý thời gian đơn giản nhất",
    excerpt:
      "Thay vì danh sách việc cần làm, đặt mỗi việc vào một ô thời gian cụ thể trên lịch.",
    sourceUrl: "https://example.com/time-boxing",
    sourceName: "Blog",
    tags: ["quản lý thời gian", "năng suất"],
    starred: false,
    createdAt: at(-5, 14, 20),
    linkedIds: ["cap_01", "cap_02"],
  },
  {
    id: "cap_08",
    type: "email",
    title: "Bản tin tuần: 5 bài viết về Deep Work",
    excerpt:
      "Tổng hợp 5 bài đáng đọc về sự tập trung sâu — đã lưu để đọc lại vào cuối tuần.",
    sourceUrl: null,
    sourceName: "Productive Weekly",
    tags: ["tập trung", "bản tin"],
    starred: false,
    createdAt: at(-1, 7, 5),
    linkedIds: ["cap_03"],
  },
  {
    id: "cap_09",
    type: "document",
    title: "Nghiên cứu: Chi phí của việc chuyển ngữ cảnh",
    excerpt:
      "Bản PDF học thuật: mỗi lần chuyển việc tốn trung bình 23 phút để lấy lại trạng thái tập trung.",
    sourceUrl: null,
    sourceName: null,
    tags: ["nghiên cứu", "tập trung"],
    starred: true,
    createdAt: at(-8, 16, 0),
    linkedIds: ["cap_02", "cap_03", "cap_11"],
  },
  {
    id: "cap_10",
    type: "video",
    title: "Thiết kế không gian làm việc tối giản",
    excerpt: "Tour 12 phút qua một góc làm việc chỉ có 5 món đồ.",
    sourceUrl: "https://youtube.com/watch?v=example2",
    sourceName: "YouTube",
    tags: ["không gian", "tối giản"],
    starred: false,
    createdAt: at(-10, 21, 15),
    linkedIds: [],
  },
  {
    id: "cap_11",
    type: "bookmark",
    title: "Học hỏi liên tục: mô hình 5 giờ mỗi tuần",
    excerpt:
      "Những người thành công dành tối thiểu 5 giờ/tuần để học có chủ đích, đều đặn suốt sự nghiệp.",
    sourceUrl: "https://example.com/five-hour-rule",
    sourceName: "Essays",
    tags: ["học tập", "phát triển"],
    starred: false,
    createdAt: at(-12, 9, 40),
    linkedIds: ["cap_09"],
  },
  {
    id: "cap_12",
    type: "podcast",
    title: "Sức khoẻ tinh thần cho người làm sáng tạo",
    excerpt: "Nghỉ ngơi không phải phần thưởng sau khi làm xong — nó là một phần của quy trình.",
    sourceUrl: "https://spotify.com/episode/example2",
    sourceName: "Spotify",
    tags: ["sức khoẻ", "sáng tạo"],
    starred: false,
    createdAt: at(-14, 18, 30),
    linkedIds: ["cap_06"],
  },
];

/**
 * Đồ thị tri thức hiển thị ở dashboard và trang Second Brain.
 *
 * Toạ độ được đặt tay để tái hiện bố cục trong ảnh mẫu: node trung tâm "Lối
 * sống hiệu suất" có ngôi sao, hai nhánh trái (Thói quen buổi sáng, Sức khoẻ)
 * nối qua chấm nhỏ, ba nhánh phải toả ra Quản lý thời gian / Tập trung sâu,
 * rồi tới Dự án Side Project và Học hỏi liên tục bằng nét đứt.
 *
 * Khi nối API, toạ độ sẽ do thuật toán force-directed tính ở client thay vì
 * hard-code — xem docs/api/second-brain.md, mục "Graph layout".
 *
 * Ràng buộc khi chỉnh toạ độ: node được căn giữa quanh điểm (x, y), nên x phải
 * nằm trong khoảng ~14–86 thì nhãn dài mới không tràn ra ngoài khung.
 */
export const knowledgeGraph: KnowledgeGraph = {
  nodes: [
    { id: "n_morning", label: "Thói quen buổi sáng", x: 15, y: 34, starred: false, color: "brand", variant: "secondary" },
    { id: "n_health", label: "Sức khoẻ", x: 15, y: 72, starred: false, color: "brand", variant: "secondary" },
    { id: "d_1", label: "", x: 30, y: 42, starred: false, color: "brand", variant: "dot" },
    { id: "d_2", label: "", x: 30, y: 66, starred: false, color: "brand", variant: "dot" },
    { id: "n_core", label: "Lối sống hiệu suất", x: 50, y: 52, starred: true, color: "brand", variant: "primary" },
    { id: "n_time", label: "Quản lý thời gian", x: 72, y: 22, starred: false, color: "sage", variant: "secondary" },
    { id: "n_focus", label: "Tập trung sâu", x: 72, y: 80, starred: false, color: "sage", variant: "secondary" },
    { id: "n_side", label: "Dự án Side Project", x: 87, y: 10, starred: false, color: "violet", variant: "secondary" },
    { id: "n_learn", label: "Học hỏi liên tục", x: 87, y: 92, starred: false, color: "sand", variant: "secondary" },
  ],
  edges: [
    { from: "n_morning", to: "d_1", strength: "strong" },
    { from: "d_1", to: "n_core", strength: "strong" },
    { from: "n_health", to: "d_2", strength: "strong" },
    { from: "d_2", to: "n_core", strength: "strong" },
    { from: "n_core", to: "n_time", strength: "strong" },
    { from: "n_core", to: "n_focus", strength: "strong" },
    { from: "n_time", to: "n_side", strength: "weak" },
    { from: "n_focus", to: "n_learn", strength: "weak" },
    { from: "n_side", to: "n_learn", strength: "weak" },
  ],
};

/** Nhãn tiếng Việt cho từng loại capture — dùng ở filter và thẻ. */
export const captureTypeLabels: Record<Capture["type"], string> = {
  note: "Ghi chú",
  bookmark: "Bookmark",
  video: "Video",
  podcast: "Podcast",
  email: "Email",
  document: "Tài liệu",
  image: "Hình ảnh",
};
