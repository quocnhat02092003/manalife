import { cn } from "@/lib/utils";
import type { EventColor } from "@/types";
import { percent } from "@/lib/utils";

const fills: Record<EventColor, string> = {
  brand: "bg-brand-600",
  clay: "bg-clay",
  violet: "bg-violet",
  sage: "bg-sage",
  sand: "bg-sand",
};

/** Tone của thanh tiến độ — thêm `danger` cho trường hợp vượt hạn mức. */
export type ProgressTone = EventColor | "danger";

const progressFills: Record<ProgressTone, string> = {
  ...fills,
  danger: "bg-danger",
};

interface ProgressProps {
  value: number;
  total: number;
  tone?: ProgressTone;
  label: string;
  className?: string;
}

/** Thanh tiến độ phẳng — dùng cho Mục tiêu và hạn mức Chi tiêu. */
export function Progress({
  value,
  total,
  tone = "brand",
  label,
  className,
}: ProgressProps) {
  const pct = percent(value, total);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", progressFills[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface DotStreakProps {
  /** Mảng ngày trong tuần: true = đã hoàn thành. */
  days: boolean[];
  tone?: EventColor;
  label: string;
}

/**
 * Dải chấm tuần trong thẻ Thói quen (ảnh mẫu: ●●●●●○○ 5/7).
 * Chấm đặc = xong, chấm rỗng = chưa.
 */
export function DotStreak({ days, tone = "brand", label }: DotStreakProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={label} role="img">
      {days.map((done, i) => (
        <span
          key={i}
          className={cn(
            "size-2.5 rounded-full",
            done ? fills[tone] : "border border-line-strong bg-surface",
          )}
        />
      ))}
    </div>
  );
}
