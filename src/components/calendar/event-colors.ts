import type { EventColor } from "@/types";

/**
 * Thanh sự kiện trong ô ngày — nền phẳng, cùng hệ tone với Badge để lịch và
 * phần còn lại của app đọc lên như một bộ màu duy nhất.
 */
export const eventBar: Record<EventColor, string> = {
  brand: "bg-brand-100 text-brand-800",
  clay: "bg-clay-soft text-clay",
  violet: "bg-violet-soft text-violet",
  sage: "bg-sage-soft text-brand-700",
  sand: "bg-sand-soft text-brand-800",
};

/** Vạch màu đặc bên trái thẻ sự kiện trong panel — trùng màu với chấm Dot. */
export const eventStripe: Record<EventColor, string> = {
  brand: "bg-brand-600",
  clay: "bg-clay",
  violet: "bg-violet",
  sage: "bg-sage",
  sand: "bg-sand",
};
