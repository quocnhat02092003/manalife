import { habitEntries, habits } from "@/lib/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { habitDays } from "./habit-days";

/**
 * Lưới nhiệt hoàn thành.
 *
 * Chỉ vẽ 7 ngày vì `habitEntries` hiện chỉ có đúng ngần ấy dữ liệu thật —
 * không suy diễn hay bù thêm ngày trống cho các tuần trước đó.
 */

/** Tra nhanh trạng thái theo cặp (thói quen, ngày). */
const doneByCell = new Map(
  habitEntries.map((entry) => [`${entry.habitId}|${entry.date}`, entry.done]),
);

/** Năm mức đậm dần theo tỉ lệ hoàn thành trong ngày. */
const LEVELS = [
  "border border-line bg-surface-muted",
  "bg-brand-100",
  "bg-brand-300",
  "bg-brand-500",
  "bg-brand-700",
];

function levelClass(ratio: number): string {
  if (ratio <= 0) return LEVELS[0];
  if (ratio <= 0.25) return LEVELS[1];
  if (ratio <= 0.5) return LEVELS[2];
  if (ratio <= 0.75) return LEVELS[3];
  return LEVELS[4];
}

export function HabitsHeatmap() {
  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div>
          <CardTitle>Lưới hoàn thành</CardTitle>
          <CardDescription className="mt-0.5">
            7 ngày gần nhất — hiện chỉ có dữ liệu cho khoảng thời gian này.
          </CardDescription>
        </div>

        {/* Chú giải mức đậm của hàng tổng. */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-faint">Ít</span>
          {LEVELS.map((level, i) => (
            <span
              key={i}
              aria-hidden
              className={cn("size-3 rounded-[3px]", level)}
            />
          ))}
          <span className="text-[11px] text-ink-faint">Nhiều</span>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto scrollbar-none">
        <div className="min-w-max">
          {/* Hàng nhãn thứ. */}
          <div className="flex items-center gap-1 pb-1.5 pl-32">
            {habitDays.map((day) => (
              <span
                key={day.key}
                className={cn(
                  "w-3 text-center text-[10px] whitespace-nowrap",
                  day.isToday ? "font-medium text-brand-700" : "text-ink-faint",
                )}
              >
                {day.label}
              </span>
            ))}
          </div>

          {/* Mỗi thói quen một hàng: ô đặc = đã hoàn thành. */}
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-1 py-1">
              <span className="w-32 shrink-0 truncate pr-3 text-[12px] text-ink-soft">
                {habit.name}
              </span>
              {habitDays.map((day) => {
                const done = doneByCell.get(`${habit.id}|${day.key}`) ?? false;
                return (
                  <span
                    key={day.key}
                    title={`${habit.name} — ${day.label} ${day.dayOfMonth}: ${
                      done ? "đã hoàn thành" : "chưa hoàn thành"
                    }`}
                    className={cn(
                      "size-3 shrink-0 rounded-[3px]",
                      done ? "bg-brand-600" : "border border-line bg-surface-muted",
                    )}
                  />
                );
              })}
            </div>
          ))}

          {/* Hàng tổng: đậm dần theo số thói quen hoàn thành trong ngày. */}
          <div className="mt-1 flex items-center gap-1 border-t border-line pt-2">
            <span className="w-32 shrink-0 truncate pr-3 text-[12px] font-medium text-ink">
              Tổng mỗi ngày
            </span>
            {habitDays.map((day) => {
              const done = habits.filter((habit) =>
                doneByCell.get(`${habit.id}|${day.key}`),
              ).length;
              return (
                <span
                  key={day.key}
                  title={`${day.label} ${day.dayOfMonth}: ${done}/${habits.length} thói quen`}
                  className={cn(
                    "size-3 shrink-0 rounded-[3px]",
                    levelClass(habits.length > 0 ? done / habits.length : 0),
                  )}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
