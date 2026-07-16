import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventColor } from "@/types";

/**
 * Ô icon vuông bo góc đứng cạnh tiêu đề mỗi thẻ — chi tiết nhận diện chính
 * của giao diện (xem ảnh mẫu: Công việc, Thói quen, Chi tiêu, Ghi chú nhanh).
 */

const tones: Record<EventColor, string> = {
  brand: "bg-brand-600 text-white",
  clay: "bg-clay text-white",
  violet: "bg-violet text-white",
  sage: "bg-sage text-brand-800",
  sand: "bg-sand text-brand-800",
};

const sizes = {
  sm: { box: "size-7 rounded-lg", icon: 15 },
  md: { box: "size-8.5 rounded-[10px]", icon: 18 },
  lg: { box: "size-11 rounded-xl", icon: 22 },
} as const;

interface IconTileProps {
  icon: LucideIcon;
  tone?: EventColor;
  size?: keyof typeof sizes;
  className?: string;
}

export function IconTile({
  icon: Icon,
  tone = "brand",
  size = "md",
  className,
}: IconTileProps) {
  const { box, icon } = sizes[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        box,
        tones[tone],
        className,
      )}
    >
      <Icon size={icon} strokeWidth={2} />
    </span>
  );
}
