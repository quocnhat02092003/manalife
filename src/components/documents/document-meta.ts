import {
  File,
  FileText,
  FileType,
  Film,
  Image as ImageIcon,
  Sheet,
  type LucideIcon,
} from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import type { DocumentKind, EventColor, PersonalDocument } from "@/types";

/**
 * Bảng tra cứu dùng chung cho mọi chỗ hiển thị tài liệu: icon, tone của IconTile
 * và nhãn tiếng Việt của từng loại. Gom về một nơi để lưới, danh sách và thẻ
 * cảnh báo luôn vẽ cùng một icon cho cùng một `kind`.
 */
export const documentKindMeta: Record<
  DocumentKind,
  { icon: LucideIcon; tone: EventColor; label: string }
> = {
  pdf: { icon: FileText, tone: "clay", label: "PDF" },
  image: { icon: ImageIcon, tone: "violet", label: "Hình ảnh" },
  video: { icon: Film, tone: "clay", label: "Video" },
  sheet: { icon: Sheet, tone: "sage", label: "Bảng tính" },
  doc: { icon: FileType, tone: "brand", label: "Văn bản" },
  other: { icon: File, tone: "sand", label: "Khác" },
};

/** Cửa sổ cảnh báo: chỉ nhắc những gì hết hạn trong 60 ngày tới. */
export const EXPIRY_WINDOW_DAYS = 60;
/** Dưới ngưỡng này là gấp — hiện màu danger thay vì warning. */
export const EXPIRY_URGENT_DAYS = 14;

export type ExpiryLevel = "danger" | "warning";

export interface ExpiryInfo {
  /** Số ngày còn lại; âm nghĩa là đã quá hạn. */
  days: number;
  level: ExpiryLevel;
  label: string;
}

/**
 * Tính trạng thái hết hạn của một tài liệu.
 * Trả về null khi tài liệu không có hạn hoặc còn xa hơn cửa sổ cảnh báo.
 */
export function getExpiryInfo(
  doc: PersonalDocument,
  now: Date = new Date(),
): ExpiryInfo | null {
  if (!doc.expiresAt) return null;

  const days = differenceInCalendarDays(new Date(doc.expiresAt), now);
  if (days > EXPIRY_WINDOW_DAYS) return null;

  // Quá hạn cũng gộp vào nhóm gấp để không bị bỏ sót.
  const level: ExpiryLevel = days < EXPIRY_URGENT_DAYS ? "danger" : "warning";

  let label: string;
  if (days < 0) label = "Đã hết hạn";
  else if (days === 0) label = "Hết hạn hôm nay";
  else label = `Còn ${days} ngày`;

  return { days, level, label };
}

/** Class của chip số ngày còn lại — màu phẳng, đủ tương phản để đọc. */
export const expiryChipClass: Record<ExpiryLevel, string> = {
  danger: "bg-danger text-white",
  warning: "bg-warning text-brand-900",
};

/** Ngày dạng "05/09/2026". */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
