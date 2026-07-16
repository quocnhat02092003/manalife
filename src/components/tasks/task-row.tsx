import { format, isPast, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, Task, TaskPriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type Tone = React.ComponentProps<typeof Badge>["tone"];

/** Ưu tiên cao dùng clay để nổi bật, thấp thì chìm hẳn xuống neutral. */
const priorityTones: Record<TaskPriority, Tone> = {
  high: "clay",
  medium: "sand",
  low: "neutral",
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

/** Hạn chót ở dạng người đọc được: gần thì dùng từ tương đối, xa thì ghi ngày. */
function formatDue(iso: string): string {
  const date = parseISO(iso);
  const time = format(date, "HH:mm");
  if (isToday(date)) return `Hôm nay, ${time}`;
  if (isTomorrow(date)) return `Ngày mai, ${time}`;
  if (isYesterday(date)) return `Hôm qua, ${time}`;
  return format(date, "d MMM, HH:mm", { locale: vi });
}

interface TaskRowProps {
  task: Task;
  project: Project | undefined;
  onToggle: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskRow({
  task,
  project,
  onToggle,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const done = task.status === "done";
  const overdue = !done && task.dueAt !== null && isPast(parseISO(task.dueAt));

  return (
    <li className="group flex items-start gap-3 px-5 py-3">
      <span className="pt-0.5">
        <Checkbox
          checked={done}
          onCheckedChange={() => onToggle(task.id)}
          label={task.title}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm transition-colors",
            done ? "text-ink-faint line-through" : "text-ink",
          )}
        >
          {task.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={priorityTones[task.priority]}>
            {priorityLabels[task.priority]}
          </Badge>

          {project ? (
            <Badge tone={project.color}>{project.name}</Badge>
          ) : null}

          {task.dueAt ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[12px]",
                overdue ? "text-danger" : "text-ink-faint",
              )}
            >
              <CalendarClock size={13} />
              {formatDue(task.dueAt)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Sửa/xoá — hiện khi hover hoặc focus, đỡ rối mắt. */}
      {onEdit || onDelete ? (
        <span className="flex shrink-0 gap-0.5 pt-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {onEdit ? (
            <button
              type="button"
              aria-label={`Sửa "${task.title}"`}
              onClick={onEdit}
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:opacity-100"
            >
              <Pencil size={14} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              aria-label={`Xoá "${task.title}"`}
              onClick={onDelete}
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger focus-visible:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </span>
      ) : null}
    </li>
  );
}
