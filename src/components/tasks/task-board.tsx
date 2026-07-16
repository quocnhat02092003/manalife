"use client";

import { useMemo, useState } from "react";
import { isPast, isToday, parseISO } from "date-fns";
import {
  CircleCheck,
  CircleDashed,
  ClipboardList,
  ListTodo,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { projects, tasks as seedTasks } from "@/lib/mock";
import type { Task, TaskStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, Dot } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskRow } from "./task-row";

type StatusFilter = "all" | TaskStatus;
type GroupKey = "overdue" | "today" | "upcoming" | "noDue" | "done";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "todo", label: "Chưa xong" },
  { value: "done", label: "Đã xong" },
];

/** Thứ tự hiển thị các nhóm — việc gấp lên trên, việc đã xong xuống cuối. */
const groupOrder: { key: GroupKey; label: string }[] = [
  { key: "overdue", label: "Quá hạn" },
  { key: "today", label: "Hôm nay" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "noDue", label: "Không có hạn" },
  { key: "done", label: "Đã xong" },
];

/**
 * Nhóm của một việc. "Quá hạn" so theo đúng thời điểm chứ không chỉ theo ngày,
 * nên việc hẹn 09:00 hôm nay sẽ rơi xuống Quá hạn khi đã qua giờ đó.
 */
function groupOf(task: Task): GroupKey {
  if (task.status === "done") return "done";
  if (!task.dueAt) return "noDue";
  const due = parseISO(task.dueAt);
  if (isPast(due)) return "overdue";
  if (isToday(due)) return "today";
  return "upcoming";
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [projectId, setProjectId] = useState<string>("all");

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

  // Thống kê luôn tính trên toàn bộ việc, không phụ thuộc bộ lọc đang chọn.
  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    return {
      total: tasks.length,
      done,
      remaining: tasks.length - done,
      overdue: tasks.filter((t) => groupOf(t) === "overdue").length,
    };
  }, [tasks]);

  const groups = useMemo(() => {
    const visible = tasks.filter(
      (task) =>
        (status === "all" || task.status === status) &&
        (projectId === "all" || task.projectId === projectId),
    );

    const map = new Map<GroupKey, Task[]>();
    for (const task of visible) {
      const key = groupOf(task);
      const bucket = map.get(key);
      if (bucket) bucket.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks, status, projectId]);

  const isEmpty = groups.size === 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={ListTodo} tone="brand" label="Tổng việc" value={stats.total} />
        <Stat icon={CircleCheck} tone="sage" label="Đã xong" value={stats.done} />
        <Stat
          icon={CircleDashed}
          tone="violet"
          label="Còn lại"
          value={stats.remaining}
        />
        <Stat
          icon={TriangleAlert}
          tone="clay"
          label="Quá hạn"
          value={stats.overdue}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={status === filter.value ? "primary" : "secondary"}
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </Button>
          ))}

          <span aria-hidden className="mx-1 h-5 w-px bg-line" />

          <Button
            size="sm"
            variant={projectId === "all" ? "primary" : "secondary"}
            aria-pressed={projectId === "all"}
            onClick={() => setProjectId("all")}
          >
            Mọi dự án
          </Button>
          {projects.map((project) => (
            <Button
              key={project.id}
              size="sm"
              variant={projectId === project.id ? "primary" : "secondary"}
              aria-pressed={projectId === project.id}
              onClick={() => setProjectId(project.id)}
            >
              <Dot tone={project.color} />
              {project.name}
            </Button>
          ))}
        </div>
      </Card>

      {isEmpty ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Không có công việc nào"
            description="Chưa có việc nào khớp bộ lọc hiện tại. Thử bỏ bớt điều kiện lọc xem sao."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatus("all");
                  setProjectId("all");
                }}
              >
                Xoá bộ lọc
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groupOrder.map(({ key, label }) => {
            const items = groups.get(key);
            if (!items || items.length === 0) return null;

            return (
              <Card key={key}>
                <div className="flex items-center gap-2 px-5 pt-4 pb-1">
                  <h2 className="text-[13px] font-semibold text-ink-soft">
                    {label}
                  </h2>
                  <Badge tone={key === "overdue" ? "clay" : "neutral"}>
                    {items.length}
                  </Badge>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      project={projects.find((p) => p.id === task.projectId)}
                      onToggle={toggle}
                    />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: React.ComponentProps<typeof IconTile>["tone"];
  label: string;
  value: number;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <IconTile icon={icon} tone={tone} size="md" />
      <div>
        <p className="text-[19px] font-semibold text-ink">{value}</p>
        <p className="text-[12px] text-ink-soft">{label}</p>
      </div>
    </Card>
  );
}
