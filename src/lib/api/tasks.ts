import type { Project, Task, TaskPriority, TaskStatus } from "@/types";

/**
 * Tầng chuyển đổi + kiểm tra dữ liệu cho module Công việc
 * (docs/api/tasks.md). POST và PATCH đi chung một validator; logic
 * `completedAt` gom về resolveCompletedAt để PATCH và toggle không lệch nhau.
 */

export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "done"];
export const TASK_PRIORITIES: readonly TaskPriority[] = [
  "low",
  "medium",
  "high",
];

/** Các cột được phép ra ngoài — KHÔNG có userId, updatedAt. */
export const taskSelect = {
  id: true,
  title: true,
  notes: true,
  status: true,
  priority: true,
  dueAt: true,
  projectId: true,
  createdAt: true,
  completedAt: true,
} as const;

interface TaskRow {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  projectId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    projectId: row.projectId,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

export function toProject(row: {
  id: string;
  name: string;
  color: string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color as Project["color"],
  };
}

/**
 * Giữ bất biến `status = "done"` ⟺ `completedAt != null` (quy tắc 1–2):
 *
 * - Đổi sang done → completedAt = now().
 * - Đổi về todo → completedAt = null.
 * - `status` vắng mặt hoặc không đổi → trả undefined = KHÔNG đụng vào
 *   completedAt (sửa title của việc đã xong không được làm mới mốc này).
 *
 * PATCH và toggle đều phải đi qua đây — viết hai lần là hai lần lệch nhau.
 */
export function resolveCompletedAt(
  current: TaskStatus,
  next: TaskStatus | undefined,
): Date | null | undefined {
  if (next === undefined || next === current) return undefined;
  return next === "done" ? new Date() : null;
}

/** Dữ liệu đã kiểm tra xong. `projectId` còn phải kiểm sở hữu ở route. */
export interface TaskData {
  title?: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: Date | null;
  projectId?: string | null;
}

export type TaskValidation =
  | { ok: true; data: TaskData }
  | { ok: false; fields: Record<string, string> };

/** Kiểm tra body POST/PATCH. `completedAt` client gửi lên bị bỏ qua hẳn. */
export function validateTask(
  input: Record<string, unknown>,
  mode: "create" | "patch",
): TaskValidation {
  const fields: Record<string, string> = {};
  const data: TaskData = {};

  if ("title" in input || mode === "create") {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length < 1 || title.length > 200) {
      fields.title = "Tiêu đề phải dài 1–200 ký tự.";
    } else {
      data.title = title;
    }
  }

  if ("notes" in input) {
    if (input.notes === null) data.notes = null;
    else if (typeof input.notes === "string") {
      if (input.notes.length > 2000) {
        fields.notes = "Ghi chú tối đa 2000 ký tự.";
      } else {
        data.notes = input.notes.trim() || null;
      }
    } else {
      fields.notes = "Ghi chú phải là chuỗi hoặc null.";
    }
  }

  if ("status" in input) {
    if (TASK_STATUSES.includes(input.status as TaskStatus)) {
      data.status = input.status as TaskStatus;
    } else {
      fields.status = "Trạng thái phải là todo | done.";
    }
  }

  if ("priority" in input) {
    if (TASK_PRIORITIES.includes(input.priority as TaskPriority)) {
      data.priority = input.priority as TaskPriority;
    } else {
      fields.priority = "Độ ưu tiên phải là low | medium | high.";
    }
  }

  if ("dueAt" in input) {
    if (input.dueAt === null) {
      data.dueAt = null;
    } else if (typeof input.dueAt === "string") {
      const value = new Date(input.dueAt);
      if (Number.isNaN(value.getTime())) {
        fields.dueAt = "Hạn phải là chuỗi ISO 8601 hoặc null.";
      } else {
        // Hạn trong quá khứ là hợp lệ (quy tắc 7) — việc quá hạn có thật.
        data.dueAt = value;
      }
    } else {
      fields.dueAt = "Hạn phải là chuỗi ISO 8601 hoặc null.";
    }
  }

  if ("projectId" in input) {
    if (input.projectId === null) data.projectId = null;
    else if (typeof input.projectId === "string") data.projectId = input.projectId;
    else fields.projectId = "projectId phải là chuỗi hoặc null.";
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data };
}
