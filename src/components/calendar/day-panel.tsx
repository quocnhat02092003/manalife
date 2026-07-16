import { format, getDay } from "date-fns";
import {
  CalendarOff,
  CircleCheck,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { CalendarEvent, Task, TaskPriority } from "@/types";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { eventStripe } from "./event-colors";

type BadgeTone = React.ComponentProps<typeof Badge>["tone"];

/** Cùng bảng tone ưu tiên với TaskRow — lịch và trang Công việc đọc như một. */
const priorityTones: Record<TaskPriority, BadgeTone> = {
  high: "clay",
  medium: "sand",
  low: "neutral",
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

/** Tên thứ đầy đủ, tra theo getDay() nên phải bắt đầu từ Chủ nhật. */
const FULL_WEEKDAYS = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

interface DayPanelProps {
  selected: Date;
  events: CalendarEvent[];
  /** Việc đến hạn trong ngày — tick được ngay trên lịch. */
  tasks: Task[];
  onAdd: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onToggleTask: (task: Task) => void;
}

export function DayPanel({
  selected,
  events,
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onToggleTask,
}: DayPanelProps) {
  const summary = [
    events.length > 0 ? `${events.length} sự kiện` : null,
    tasks.length > 0 ? `${tasks.length} việc đến hạn` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div>
          <p className="text-[13px] font-medium text-ink-soft">
            {FULL_WEEKDAYS[getDay(selected)]}
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold text-ink">
            {format(selected, "d 'tháng' M, yyyy")}
          </h2>
          <p className="mt-1 text-[13px] text-ink-faint">
            {summary || "Chưa có sự kiện nào"}
          </p>
        </div>
        <IconButton aria-label="Thêm sự kiện vào ngày này" onClick={onAdd}>
          <Plus size={17} />
        </IconButton>
      </div>

      <div className="border-t border-line">
        {events.length === 0 && tasks.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Ngày trống"
            description="Không có sự kiện hay việc đến hạn nào trong ngày này. Chọn một ngày khác hoặc thêm sự kiện mới."
          />
        ) : null}

        {events.length > 0 ? (
          <ul className="space-y-2.5 p-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="group relative rounded-xl border border-line bg-surface p-3 pl-4"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 bottom-3 left-1.5 w-1 rounded-full",
                    eventStripe[event.color],
                  )}
                />
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="shrink-0 text-ink-faint" />
                  <span className="text-[12px] font-medium text-ink-soft">
                    {event.allDay
                      ? "Cả ngày"
                      : `${formatTime(new Date(event.startsAt))} – ${formatTime(new Date(event.endsAt))}`}
                  </span>

                  {/* Sửa/xoá — hiện khi hover hoặc focus, đỡ rối mắt. */}
                  <span className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={`Sửa "${event.title}"`}
                      onClick={() => onEdit(event)}
                      className="rounded-md p-1 text-ink-faint transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:opacity-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Xoá "${event.title}"`}
                      onClick={() => onDelete(event)}
                      className="rounded-md p-1 text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger focus-visible:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-ink">
                  {event.title}
                </p>

                {event.location ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <MapPin size={13} className="shrink-0 text-ink-faint" />
                    <span className="truncate text-[12px] text-ink-soft">
                      {event.location}
                    </span>
                  </div>
                ) : null}

                {event.description ? (
                  <p className="mt-1.5 text-[13px] text-ink-soft">
                    {event.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Việc đến hạn trong ngày — dữ liệu từ /api/tasks, tick tại chỗ. */}
        {tasks.length > 0 ? (
          <div className={cn(events.length > 0 && "border-t border-line")}>
            <p className="flex items-center gap-1.5 px-4 pt-3.5 text-[12px] font-semibold text-ink-soft">
              <CircleCheck size={13} aria-hidden />
              Việc đến hạn
            </p>
            <ul className="space-y-1 p-4 pt-2">
              {tasks.map((task) => {
                const done = task.status === "done";
                return (
                  <li key={task.id} className="flex items-start gap-2.5 py-1">
                    <span className="pt-0.5">
                      <Checkbox
                        checked={done}
                        onCheckedChange={() => onToggleTask(task)}
                        label={task.title}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[13px] leading-snug transition-colors",
                          done ? "text-ink-faint line-through" : "text-ink",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {task.dueAt ? (
                          <span className="text-[11px] text-ink-faint">
                            {formatTime(new Date(task.dueAt))}
                          </span>
                        ) : null}
                        <Badge tone={priorityTones[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
