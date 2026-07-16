import { cn } from "@/lib/utils";
import type { EventColor } from "@/types";

/** Màu vẽ SVG — đọc thẳng từ CSS variable để không lệch với token Tailwind. */
const strokes: Record<EventColor, string> = {
  brand: "var(--color-brand-600)",
  clay: "var(--color-clay)",
  violet: "var(--color-violet)",
  sage: "var(--color-sage)",
  sand: "var(--color-sand)",
};

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: EventColor;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  className?: string;
}

/**
 * Biểu đồ tròn khuyết vẽ bằng SVG thuần — không dùng thư viện chart.
 *
 * Kỹ thuật: mỗi cung là một <circle> có `stroke-dasharray` bằng độ dài cung
 * cần vẽ, và `stroke-dashoffset` đẩy nó tới đúng vị trí bắt đầu. Xoay -90°
 * để cung đầu tiên khởi đầu từ đỉnh (12 giờ) thay vì 3 giờ.
 *
 * Màu phẳng, không gradient — theo quy tắc trong docs/ui-guidelines.md.
 */
export function DonutChart({
  segments,
  size = 132,
  thickness = 18,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Tính sẵn độ dài cung và vị trí bắt đầu của từng cung trước khi render.
  // Cộng dồn một biến trong lúc map sẽ vi phạm quy tắc thuần khiết của React
  // Compiler (react-hooks/immutability).
  const arcs = segments.reduce<
    Array<{ segment: DonutSegment; length: number; offset: number }>
  >((acc, segment) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const length = fraction * circumference;
    const previous = acc.at(-1);
    const offset = previous ? previous.offset + previous.length : 0;
    acc.push({ segment, length, offset });
    return acc;
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={`Biểu đồ tỉ lệ: ${segments
        .map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`)
        .join(", ")}`}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {arcs.map(({ segment, length, offset }) => (
          <circle
            key={segment.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokes[segment.color]}
            strokeWidth={thickness}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
          />
        ))}
      </g>
    </svg>
  );
}
