import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays, Circle, CircleCheck } from "lucide-react";
import { cn, formatCurrency, formatNumber, percent } from "@/lib/utils";
import type { EventColor, Goal, GoalHorizon, GoalStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Tone = React.ComponentProps<typeof Badge>["tone"];

export const horizonLabels: Record<GoalHorizon, string> = {
  quarter: "Quý",
  year: "Năm",
  life: "Cả đời",
};

export const statusLabels: Record<GoalStatus, string> = {
  active: "Đang theo đuổi",
  done: "Hoàn thành",
  paused: "Tạm dừng",
};

const statusTones: Record<GoalStatus, Tone> = {
  active: "brand",
  done: "sage",
  paused: "neutral",
};

/** Thanh tiến độ đi theo trạng thái: tạm dừng thì chìm hẳn xuống sand. */
const progressTones: Record<GoalStatus, EventColor> = {
  active: "brand",
  done: "sage",
  paused: "sand",
};

/**
 * Đơn vị "₫" phải qua formatCurrency, nếu không sẽ ra "78000000 ₫".
 * Các đơn vị khác giữ dạng ngắn: "14/24 cuốn".
 */
function formatProgress(goal: Goal): string {
  if (goal.unit === "₫") {
    return `${formatCurrency(goal.progressCurrent)} / ${formatCurrency(goal.progressTarget)}`;
  }
  return `${formatNumber(goal.progressCurrent)}/${formatNumber(goal.progressTarget)} ${goal.unit}`;
}

/** Số ngày còn lại tính theo ngày lịch, nên không lệch vì giờ trong ngày. */
function remaining(iso: string, done: boolean): { text: string; overdue: boolean } {
  if (done) return { text: "Đã hoàn thành", overdue: false };
  const days = differenceInCalendarDays(parseISO(iso), new Date());
  if (days > 0) return { text: `Còn ${days} ngày`, overdue: false };
  if (days === 0) return { text: "Hết hạn hôm nay", overdue: false };
  return { text: `Quá hạn ${Math.abs(days)} ngày`, overdue: true };
}

export function GoalCard({ goal }: { goal: Goal }) {
  const done = goal.status === "done";
  const pct = percent(goal.progressCurrent, goal.progressTarget);
  const due = goal.dueAt ? remaining(goal.dueAt, done) : null;

  return (
    <Card className="flex h-full flex-col">
      <div className="px-5 pt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="sand">{horizonLabels[goal.horizon]}</Badge>
          <Badge tone={statusTones[goal.status]}>{statusLabels[goal.status]}</Badge>
        </div>

        <h3 className="mt-2.5 text-[15px] font-semibold text-ink">{goal.title}</h3>
        {goal.description ? (
          <p className="mt-1 text-[13px] text-ink-soft">{goal.description}</p>
        ) : null}

        <div className="mt-4">
          <Progress
            value={goal.progressCurrent}
            total={goal.progressTarget}
            tone={progressTones[goal.status]}
            label={`Tiến độ mục tiêu ${goal.title}`}
          />
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-ink">
              {formatProgress(goal)}
            </span>
            <span className="text-[13px] font-medium text-ink-soft">{pct}%</span>
          </div>
        </div>
      </div>

      {goal.milestones.length > 0 ? (
        <ul className="mt-4 space-y-2.5 px-5 pb-5">
          {goal.milestones.map((milestone) => (
            <li key={milestone.id} className="flex items-center gap-2.5">
              {milestone.done ? (
                <CircleCheck size={15} className="shrink-0 text-brand-600" />
              ) : (
                <Circle size={15} className="shrink-0 text-ink-faint" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px]",
                  milestone.done ? "text-ink-faint line-through" : "text-ink-soft",
                )}
              >
                {milestone.title}
              </span>
              {milestone.dueAt ? (
                <span className="shrink-0 text-[12px] text-ink-faint">
                  {format(parseISO(milestone.dueAt), "d MMM", { locale: vi })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <CardFooter className="mt-auto flex items-center gap-2">
        <CalendarDays size={15} className="shrink-0 text-ink-faint" />
        <span className="text-[12px] text-ink-soft">
          {goal.dueAt
            ? format(parseISO(goal.dueAt), "d MMMM yyyy", { locale: vi })
            : "Chưa đặt hạn chót"}
        </span>
        {due ? (
          <span
            className={cn(
              "ml-auto text-[12px] font-medium",
              due.overdue ? "text-danger" : "text-ink-soft",
            )}
          >
            {due.text}
          </span>
        ) : null}
      </CardFooter>
    </Card>
  );
}
