import { cn } from "@/lib/utils";
import type { EventColor } from "@/types";

type Tone = EventColor | "neutral";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  clay: "bg-clay-soft text-clay",
  violet: "bg-violet-soft text-violet",
  sage: "bg-sage-soft text-brand-700",
  sand: "bg-sand-soft text-brand-800",
  neutral: "bg-surface-muted text-ink-soft",
};

interface BadgeProps extends React.ComponentProps<"span"> {
  tone?: Tone;
}

/** Nhãn nhỏ: "3 việc còn lại", tag ghi chú, loại tài liệu. */
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Chấm tròn nhỏ đánh dấu màu — dùng trong lịch và legend biểu đồ. */
export function Dot({
  tone = "brand",
  className,
}: {
  tone?: EventColor;
  className?: string;
}) {
  const fills: Record<EventColor, string> = {
    brand: "bg-brand-600",
    clay: "bg-clay",
    violet: "bg-violet",
    sage: "bg-sage",
    sand: "bg-sand",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", fills[tone], className)}
    />
  );
}
