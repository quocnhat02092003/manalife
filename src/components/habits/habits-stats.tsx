import { CircleCheckBig, Sprout, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EventColor } from "@/types";
import { habits, weeklyCount } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { percent } from "@/lib/utils";

interface Stat {
  icon: LucideIcon;
  tone: EventColor;
  value: string;
  label: string;
}

/** Ba con số tổng hợp của tuần này, tính từ dữ liệu thật trong mock. */
export function HabitsStats() {
  const totalDone = habits.reduce((sum, h) => sum + weeklyCount(h.id), 0);
  const totalTarget = habits.reduce((sum, h) => sum + h.targetPerWeek, 0);

  const stats: Stat[] = [
    {
      icon: Sprout,
      tone: "brand",
      value: String(habits.length),
      label: "Thói quen đang theo",
    },
    {
      icon: CircleCheckBig,
      tone: "sage",
      value: String(totalDone),
      label: "Lượt hoàn thành tuần này",
    },
    {
      icon: TrendingUp,
      tone: "violet",
      // Tỉ lệ gộp: tổng lượt đã làm trên tổng mục tiêu của mọi thói quen.
      value: `${percent(totalDone, totalTarget)}%`,
      label: "Tỉ lệ hoàn thành trung bình",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-3 p-5">
          <IconTile icon={stat.icon} tone={stat.tone} size="md" />
          <div className="min-w-0">
            <p className="text-[20px] font-semibold text-ink">{stat.value}</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">{stat.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
