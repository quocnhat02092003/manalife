import type { Habit } from "@/types";
import { weekStreak, weeklyCount } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { DotStreak, Progress } from "@/components/ui/progress";
import { cn, percent } from "@/lib/utils";
import { habitDays, habitIcon } from "./habit-days";

/** Thẻ một thói quen: dải 7 ngày gần nhất + tiến độ so với mục tiêu tuần. */
export function HabitCard({ habit }: { habit: Habit }) {
  const streak = weekStreak(habit.id);
  const count = weeklyCount(habit.id);
  const pct = percent(count, habit.targetPerWeek);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <IconTile icon={habitIcon(habit.icon)} tone={habit.color} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-ink">
            {habit.name}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {count}/{habit.targetPerWeek} ngày tuần này
          </p>
        </div>
        <span className="shrink-0 text-[13px] font-medium text-brand-700">
          {pct}%
        </span>
      </div>

      {/* Dải chấm 7 ngày; nhãn thứ canh giữa ngay dưới từng chấm. */}
      <div className="mt-4">
        <DotStreak
          days={streak}
          tone={habit.color}
          label={`${habit.name}: ${count} trên ${habit.targetPerWeek} ngày tuần này`}
        />
        <div className="mt-1.5 flex items-center gap-1.5" aria-hidden>
          {habitDays.map((day) => (
            <span
              key={day.key}
              className={cn(
                "w-2.5 text-center text-[10px] whitespace-nowrap",
                day.isToday ? "font-medium text-brand-700" : "text-ink-faint",
              )}
            >
              {day.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Progress
          value={count}
          total={habit.targetPerWeek}
          tone={habit.color}
          label={`Tiến độ tuần của ${habit.name}`}
        />
      </div>
    </Card>
  );
}
