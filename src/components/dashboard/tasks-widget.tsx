"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Plus } from "lucide-react";
import { tasks as seedTasks } from "@/lib/mock";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Danh sách việc hôm nay. Tick được ngay tại chỗ — hiện chỉ đổi state local,
 * khi nối API sẽ gọi PATCH /api/tasks/:id với optimistic update.
 */
export function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks.slice(0, 5));

  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "done" ? "todo" : "done",
              completedAt:
                task.status === "done" ? null : new Date().toISOString(),
            }
          : task,
      ),
    );
  }

  const remaining = tasks.filter((t) => t.status === "todo").length;

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <IconTile icon={CircleCheck} tone="brand" size="sm" />
          <h2 className="text-[15px] font-semibold text-ink">Công việc</h2>
        </div>
        <IconButton aria-label="Thêm công việc">
          <Plus size={17} />
        </IconButton>
      </div>

      <ul className="flex-1 space-y-0.5 px-5">
        {tasks.map((task) => {
          const done = task.status === "done";
          return (
            <li key={task.id} className="flex items-center gap-3 py-1.5">
              <Checkbox
                checked={done}
                onCheckedChange={() => toggle(task.id)}
                label={task.title}
              />
              <span
                className={cn(
                  "truncate text-sm transition-colors",
                  done ? "text-ink-faint line-through" : "text-ink",
                )}
              >
                {task.title}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="px-5 pt-3 pb-5">
        <Link href="/tasks" aria-label={`Xem tất cả công việc, còn ${remaining} việc`}>
          <Badge tone="brand" className="transition-colors hover:bg-brand-100">
            {remaining > 0 ? `${remaining} việc còn lại` : "Xong hết rồi"}
          </Badge>
        </Link>
      </div>
    </Card>
  );
}
