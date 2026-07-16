import { addDays, format, getDay } from "date-fns";
import { BookOpen, Dumbbell, Flower2, Moon, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TODAY } from "@/lib/mock/dates";

/**
 * Map tên icon (lưu dạng string trong dữ liệu) sang component lucide.
 * Cần map tường minh vì không thể import động theo tên khi bundle.
 */
const iconMap: Record<string, LucideIcon> = {
  Flower2,
  BookOpen,
  Dumbbell,
  Moon,
};

/** Icon của thói quen, fallback về Sprout khi tên icon chưa được map. */
export function habitIcon(name: string): LucideIcon {
  return iconMap[name] ?? Sprout;
}

/** Nhãn thứ tra theo getDay() nên phải bắt đầu từ Chủ nhật. */
const SHORT_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Số ngày có dữ liệu thật trong `habitEntries` — xem src/lib/mock/habits.ts. */
export const WINDOW_DAYS = 7;

export interface HabitDay {
  /** Khớp `HabitEntry.date`, dạng "YYYY-MM-DD". */
  key: string;
  /** Nhãn thứ ngắn: T2..CN. */
  label: string;
  /** Ngày trong tháng, dùng cho tooltip. */
  dayOfMonth: string;
  isToday: boolean;
}

/**
 * Cửa sổ ngày dùng chung cho dải chấm và lưới hoàn thành.
 * Khớp đúng thứ tự của `weekStreak()`: phần tử đầu là 6 ngày trước, cuối là hôm nay.
 */
export const habitDays: HabitDay[] = Array.from({ length: WINDOW_DAYS }, (_, i) => {
  const date = addDays(TODAY, i - (WINDOW_DAYS - 1));
  return {
    key: format(date, "yyyy-MM-dd"),
    label: SHORT_WEEKDAYS[getDay(date)],
    dayOfMonth: format(date, "d/M"),
    isToday: i === WINDOW_DAYS - 1,
  };
});
