"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isPast, parseISO } from "date-fns";
import { CalendarClock, CircleCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDue } from "@/components/tasks/task-row";
import type { Task } from "@/types";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

/** Tải việc chưa xong mới nhất. Helper thuần — setState nằm sau await. */
async function fetchTodoTasks(): Promise<
  { ok: true; tasks: Task[]; total: number } | { ok: false }
> {
  try {
    const response = await fetch("/api/tasks?status=todo&perPage=5");
    if (!response.ok) return { ok: false };
    const body = (await response.json()) as {
      data: Task[];
      meta: { total: number };
    };
    return { ok: true, tasks: body.data, total: body.meta.total };
  } catch {
    return { ok: false };
  }
}

/**
 * Việc chưa xong gần đây — dữ liệu thật từ /api/tasks. Tick tại chỗ gọi
 * PATCH /toggle với optimistic update; việc đã tick vẫn nằm lại danh sách
 * (gạch ngang) cho tới lần tải sau, đỡ giật.
 */
export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTodo, setTotalTodo] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchTodoTasks().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setTasks(result.tasks);
        setTotalTodo(result.total);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(id: string) {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const wasDone = target.status === "done";

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: wasDone ? "todo" : "done" }
          : task,
      ),
    );
    setTotalTodo((n) => Math.max(0, wasDone ? n + 1 : n - 1));

    const response = await fetch(`/api/tasks/${id}/toggle`, {
      method: "PATCH",
    });
    if (!response.ok) {
      // Hoàn lại khi server từ chối.
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, status: wasDone ? "done" : "todo" }
            : task,
        ),
      );
      setTotalTodo((n) => Math.max(0, wasDone ? n - 1 : n + 1));
      toast.error("Không cập nhật được công việc. Thử lại sau.");
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <IconTile icon={CircleCheck} tone="brand" size="sm" />
          <h2 className="text-[15px] font-semibold text-ink">Công việc</h2>
        </div>
        {/* Link styled như IconButton — thêm việc thì sang trang Công việc. */}
        <Link
          href="/tasks"
          aria-label="Thêm công việc"
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          <Plus size={17} />
        </Link>
      </div>

      {loading ? (
        <p className="flex-1 px-5 py-2 text-[13px] text-ink-faint">
          Đang tải công việc…
        </p>
      ) : tasks.length > 0 ? (
        <ul className="flex-1 space-y-0.5 px-5">
          {tasks.map((task) => {
            const done = task.status === "done";
            const overdue =
              !done && task.dueAt !== null && isPast(parseISO(task.dueAt));
            return (
              <li key={task.id} className="flex items-start gap-3 py-1.5">
                <span className="pt-0.5">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggle(task.id)}
                    label={task.title}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm transition-colors",
                      done ? "text-ink-faint line-through" : "text-ink",
                    )}
                  >
                    {task.title}
                  </span>
                  {/* Hạn cụ thể — cùng kiểu chữ nghĩa với trang Công việc. */}
                  {task.dueAt ? (
                    <span
                      className={cn(
                        "mt-0.5 inline-flex items-center gap-1 text-[11px]",
                        overdue ? "text-danger" : "text-ink-faint",
                      )}
                    >
                      <CalendarClock size={11} aria-hidden />
                      {formatDue(task.dueAt)}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex-1 px-5 py-2 text-[13px] text-ink-faint">
          Không còn việc nào chưa xong. Tuyệt!
        </p>
      )}

      <div className="px-5 pt-3 pb-5">
        <Link
          href="/tasks"
          aria-label={`Xem tất cả công việc, còn ${totalTodo} việc`}
        >
          <Badge tone="brand" className="transition-colors hover:bg-brand-100">
            {totalTodo > 0 ? `${totalTodo} việc còn lại` : "Xong hết rồi"}
          </Badge>
        </Link>
      </div>
    </Card>
  );
}
