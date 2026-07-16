"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Project, Task, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Có mặt = sửa việc này; vắng mặt = tạo mới. */
  task?: Task | null;
  projects: Project[];
  /** Gọi sau khi server xác nhận — board vá danh sách tại chỗ. */
  onSaved: (task: Task, mode: "create" | "edit") => void;
}

interface FormState {
  title: string;
  notes: string;
  priority: TaskPriority;
  /** Rỗng = không có hạn. */
  dueDate: string;
  dueTime: string;
  /** "" = không gán dự án. */
  projectId: string;
}

function initialForm(task: Task | null): FormState {
  if (task) {
    const due = task.dueAt ? new Date(task.dueAt) : null;
    return {
      title: task.title,
      notes: task.notes ?? "",
      priority: task.priority,
      dueDate: due ? format(due, "yyyy-MM-dd") : "",
      dueTime: due ? format(due, "HH:mm") : "17:00",
      projectId: task.projectId ?? "",
    };
  }
  return {
    title: "",
    notes: "",
    priority: "medium",
    dueDate: "",
    dueTime: "17:00",
    projectId: "",
  };
}

/** Hộp thoại tạo/sửa công việc — gọi POST hoặc PATCH /api/tasks. */
export function TaskDialog({
  open,
  onOpenChange,
  task = null,
  projects,
  onSaved,
}: TaskDialogProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(task));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Nạp lại form mỗi lần MỞ — pattern "adjust state during render".
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initialForm(task));
      setErrors({});
    }
  }

  function patch(update: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (!form.title.trim()) found.title = "Vui lòng nhập tiêu đề.";
    const dueAt = form.dueDate
      ? new Date(`${form.dueDate}T${form.dueTime || "17:00"}`)
      : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      found.dueAt = "Hạn không hợp lệ.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      priority: form.priority,
      dueAt: dueAt ? dueAt.toISOString() : null,
      projectId: form.projectId || null,
    };

    setSaving(true);
    try {
      const response = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const { data } = (await response.json()) as { data: Task };
        onSaved(data, task ? "edit" : "create");
        onOpenChange(false);
        toast.success(task ? "Đã cập nhật công việc." : "Đã thêm công việc.");
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string; fields?: Record<string, string> };
      } | null;
      if (body?.error?.fields) setErrors(body.error.fields);
      else toast.error(body?.error?.message ?? "Có lỗi xảy ra. Thử lại sau.");
    } catch {
      toast.error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Sửa công việc" : "Thêm công việc"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Chỉnh sửa chi tiết rồi bấm Lưu."
              : "Việc mới mặc định ở trạng thái chưa xong."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Tiêu đề" htmlFor="task-title" error={errors.title}>
            <Input
              id="task-title"
              placeholder="Hoàn thành báo cáo tuần…"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              aria-invalid={Boolean(errors.title)}
            />
          </Field>

          <Field label="Ghi chú" htmlFor="task-notes" error={errors.notes}>
            <textarea
              id="task-notes"
              rows={3}
              placeholder="Chi tiết thêm… (tuỳ chọn)"
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-brand-500"
            />
          </Field>

          {/* Độ ưu tiên: 3 nút phân đoạn — tập cố định, không cần dropdown. */}
          <fieldset>
            <legend className="text-[13px] font-medium text-ink-soft">
              Độ ưu tiên
            </legend>
            <div className="mt-2 flex gap-2">
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={form.priority === value}
                  onClick={() => patch({ priority: value })}
                  className={cn(
                    "h-8 rounded-lg border px-3 text-[13px] font-medium transition-colors",
                    form.priority === value
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line-strong bg-surface text-ink-soft hover:bg-surface-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Hạn hoàn thành"
              htmlFor="task-due-date"
              error={errors.dueAt}
              hint={!form.dueDate ? "Bỏ trống nếu không có hạn." : undefined}
            >
              <Input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => patch({ dueDate: e.target.value })}
                aria-invalid={Boolean(errors.dueAt)}
              />
            </Field>
            {form.dueDate ? (
              <Field label="Giờ" htmlFor="task-due-time">
                <Input
                  id="task-due-time"
                  type="time"
                  value={form.dueTime}
                  onChange={(e) => patch({ dueTime: e.target.value })}
                />
              </Field>
            ) : null}
          </div>

          <Field label="Dự án" htmlFor="task-project" error={errors.projectId}>
            {/* select thuần styled khớp Input — dự án ít, không cần combobox. */}
            <select
              id="task-project"
              value={form.projectId}
              onChange={(e) => patch({ projectId: e.target.value })}
              className="h-9.5 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:outline-2 focus:outline-brand-500"
            >
              <option value="">Không gán dự án</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu…
                </>
              ) : task ? (
                "Lưu thay đổi"
              ) : (
                "Thêm công việc"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
