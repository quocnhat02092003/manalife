import {
  Bookmark,
  FileText,
  Image as ImageIcon,
  Mail,
  NotebookPen,
  Podcast,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { CaptureType, EventColor } from "@/types";

/**
 * Icon và tông màu cho từng loại capture — dùng chung giữa bộ lọc và thẻ để
 * cùng một loại luôn trông giống nhau ở mọi chỗ trên trang.
 *
 * Bảng màu chỉ có 5 tông cho 7 loại, nên hai cặp phải dùng lại tông: ghi chú /
 * tài liệu (brand) và video / hình ảnh (violet). Trong mỗi cặp icon khác nhau
 * rõ nên vẫn phân biệt được.
 */
export const captureMeta: Record<
  CaptureType,
  { icon: LucideIcon; tone: EventColor }
> = {
  note: { icon: NotebookPen, tone: "brand" },
  bookmark: { icon: Bookmark, tone: "clay" },
  video: { icon: Video, tone: "violet" },
  podcast: { icon: Podcast, tone: "sage" },
  email: { icon: Mail, tone: "sand" },
  document: { icon: FileText, tone: "brand" },
  image: { icon: ImageIcon, tone: "violet" },
};

/** Thứ tự hiển thị các loại trong dải bộ lọc. */
export const captureTypeOrder: CaptureType[] = [
  "note",
  "bookmark",
  "video",
  "podcast",
  "email",
  "document",
  "image",
];
