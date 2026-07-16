"use client";

import { useEffect, useMemo, useState } from "react";
import { isPast, isToday, parseISO } from "date-fns";
import {
  CircleCheck,
  CircleDashed,
  ClipboardList,
  FolderPlus,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notifications";
import type { Project, Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, Dot } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { TaskRow } from "./task-row";
import { TaskDialog } from "./task-dialog";
import { ProjectDialog } from "./project-dialog";

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

/** Tải toàn bộ việc + dự án. Helper thuần — mọi setState nằm sau await. */
async function fetchBoardData(): Promise<
  | { ok: true; tasks: Task[]; projects: Project[] }
  | { ok: false; message: string }
> {
  try {
    const [tasksRes, projectsRes] = await Promise.all([
      // perPage=100 đủ cho quy mô cá nhân; vượt thì tính sau.
      fetch("/api/tasks?perPage=100"),
      fetch("/api/projects"),
    ]);
    if (!tasksRes.ok || !projectsRes.ok) {
      return { ok: false, message: "Không tải được công việc. Thử lại sau." };
    }
    const tasks = ((await tasksRes.json()) as { data: Task[] }).data;
    const projects = ((await projectsRes.json()) as { data: Project[] }).data;
    return { ok: true, tasks, projects };
  } catch {
    return {
      ok: false,
      message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
    };
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? "Có lỗi xảy ra. Thử lại sau.";
  } catch {
    return "Có lỗi xảy ra. Thử lại sau.";
  }
}

type PendingDelete =
  | { type: "task"; task: Task }
  | { type: "project"; project: Project };

/**
 * Bảng công việc chạy trên dữ liệu thật: thống kê, lọc theo trạng thái/dự
 * án, nhóm theo hạn. Toggle gọi PATCH /toggle (server tự lật — không race
 * giữa các tab); tạo/sửa qua TaskDialog; xoá việc/dự án sau AlertDialog.
 */
export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [projectId, setProjectId] = useState<string>("all");

  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchBoardData().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setTasks(result.tasks);
        setProjects(result.projects);
      } else {
        toast.error(result.message);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Thao tác ghi
  // -------------------------------------------------------------------------

  async function handleToggle(id: string) {
    const before = tasks;
    // Lạc quan: lật ngay trên UI; server là nguồn sự thật cuối (toggle tự
    // đọc trạng thái hiện tại nên không sợ ghi đè dữ liệu cũ).
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

    const response = await fetch(`/api/tasks/${id}/toggle`, { method: "PATCH" });
    if (!response.ok) {
      setTasks(before);
      toast.error(await readErrorMessage(response));
      return;
    }
    const { data } = (await response.json()) as { data: Task };
    setTasks((prev) => prev.map((task) => (task.id === id ? data : task)));
  }

  function handleTaskSaved(task: Task, mode: "create" | "edit") {
    setTasks((prev) =>
      mode === "create"
        ? [task, ...prev]
        : prev.map((item) => (item.id === task.id ? task : item)),
    );
    notify({
      title:
        mode === "create"
          ? `Đã thêm công việc "${task.title}"`
          : `Đã cập nhật công việc "${task.title}"`,
      href: "/tasks",
    });
  }

  function handleProjectCreated(project: Project) {
    setProjects((prev) =>
      [...prev, project].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    );
    notify({ title: `Đã tạo dự án "${project.name}"`, href: "/tasks" });
  }

  async function confirmPendingDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    if (target.type === "task") {
      const response = await fetch(`/api/tasks/${target.task.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }
      setTasks((prev) => prev.filter((task) => task.id !== target.task.id));
      toast.success(`Đã xoá "${target.task.title}".`);
      notify({ title: `Đã xoá công việc "${target.task.title}"`, href: "/tasks" });
      return;
    }

    const response = await fetch(`/api/projects/${target.project.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error(await readErrorMessage(response));
      return;
    }
    const { data } = (await response.json()) as {
      data: { unlinkedTasks: number };
    };
    // Việc bên trong không mất — chỉ trở về nhóm "chưa gán dự án".
    setTasks((prev) =>
      prev.map((task) =>
        task.projectId === target.project.id
          ? { ...task, projectId: null }
          : task,
      ),
    );
    setProjects((prev) => prev.filter((p) => p.id !== target.project.id));
    if (projectId === target.project.id) setProjectId("all");
    toast.success(
      data.unlinkedTasks > 0
        ? `Đã xoá dự án "${target.project.name}" — ${data.unlinkedTasks} việc chuyển về "chưa gán dự án".`
        : `Đã xoá dự án "${target.project.name}".`,
    );
  }

  // -------------------------------------------------------------------------
  // Dẫn xuất hiển thị
  // -------------------------------------------------------------------------

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
            <span key={project.id} className="group relative inline-flex">
              <Button
                size="sm"
                variant={projectId === project.id ? "primary" : "secondary"}
                aria-pressed={projectId === project.id}
                onClick={() => setProjectId(project.id)}
                className="group-hover:pr-8"
              >
                <Dot tone={project.color} />
                {project.name}
              </Button>
              {/* Xoá dự án — hiện khi hover; việc bên trong được giữ lại. */}
              <button
                type="button"
                aria-label={`Xoá dự án "${project.name}"`}
                onClick={() =>
                  setPendingDelete({ type: "project", project })
                }
                className={cn(
                  "absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity",
                  "group-focus-within:opacity-100 group-hover:opacity-100",
                  projectId === project.id
                    ? "text-white/80 hover:text-white"
                    : "text-ink-faint hover:text-danger",
                )}
              >
                <Trash2 size={13} />
              </button>
            </span>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setProjectDialogOpen(true)}
          >
            <FolderPlus size={15} />
            Dự án mới
          </Button>

          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setTaskDialog({ open: true, task: null })}
          >
            <Plus size={15} />
            Thêm công việc
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="flex items-center justify-center gap-2 py-10 text-[13px] text-ink-faint">
            <Loader2 size={15} className="animate-spin" aria-hidden />
            Đang tải công việc…
          </p>
        </Card>
      ) : isEmpty ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={tasks.length === 0 ? "Chưa có công việc nào" : "Không có công việc nào"}
            description={
              tasks.length === 0
                ? "Thêm việc đầu tiên để bắt đầu theo dõi những gì cần làm."
                : "Chưa có việc nào khớp bộ lọc hiện tại. Thử bỏ bớt điều kiện lọc xem sao."
            }
            action={
              tasks.length === 0 ? (
                <Button
                  size="sm"
                  onClick={() => setTaskDialog({ open: true, task: null })}
                >
                  <Plus size={15} />
                  Thêm công việc
                </Button>
              ) : (
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
              )
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
                      onToggle={handleToggle}
                      onEdit={() => setTaskDialog({ open: true, task })}
                      onDelete={() => setPendingDelete({ type: "task", task })}
                    />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) =>
          setTaskDialog((prev) => ({ open, task: open ? prev.task : null }))
        }
        task={taskDialog.task}
        projects={projects}
        onSaved={handleTaskSaved}
      />

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onCreated={handleProjectCreated}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.type === "task"
                ? `Xoá công việc "${pendingDelete.task.title}"?`
                : `Xoá dự án "${pendingDelete?.project.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.type === "task"
                ? "Công việc sẽ bị xoá vĩnh viễn. Không hoàn tác được."
                : "Việc bên trong không bị xoá — chúng chuyển về nhóm “chưa gán dự án”."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPendingDelete}
              className="bg-danger text-white hover:bg-danger/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
