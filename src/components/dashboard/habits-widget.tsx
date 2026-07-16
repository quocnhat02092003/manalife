import { BookOpen, Dumbbell, Flower2, Moon, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { habits, weekStreak, weeklyCount } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { DotStreak } from "@/components/ui/progress";

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

/** Thói quen tuần này: mỗi dòng là một dải 7 chấm + số ngày đã hoàn thành. */
export function HabitsWidget() {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <IconTile icon={Sprout} tone="sage" size="sm" />
        <h2 className="text-[15px] font-semibold text-ink">Thói quen</h2>
      </div>

      <ul className="flex-1 px-5 pb-5">
        {habits.map((habit) => {
          const Icon = iconMap[habit.icon] ?? Sprout;
          const streak = weekStreak(habit.id);
          const count = weeklyCount(habit.id);

          return (
            <li
              key={habit.id}
              className="flex items-center gap-3 border-b border-line py-3 last:border-0"
            >
              <Icon size={18} className="shrink-0 text-brand-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {habit.name}
                </p>
                <div className="mt-1.5">
                  <DotStreak
                    days={streak}
                    tone={habit.color}
                    label={`${habit.name}: ${count} trên ${habit.targetPerWeek} ngày tuần này`}
                  />
                </div>
              </div>
              <span className="shrink-0 text-[12px] font-medium text-ink-soft">
                {count}/{habit.targetPerWeek}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
