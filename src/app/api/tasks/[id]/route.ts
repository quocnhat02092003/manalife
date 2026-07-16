import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  fail,
  malformedJson,
  notFound,
  ok,
  readJson,
  unauthenticated,
} from "@/lib/api/http";
import { requireSession } from "@/lib/api/require-session";
import {
  resolveCompletedAt,
  taskSelect,
  toTask,
  validateTask,
} from "@/lib/api/tasks";
import type { TaskStatus } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/tasks/:id — chi tiết một việc. */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const row = await prisma.task.findFirst({
    where: { id, userId: session.userId },
    select: taskSelect,
  });
  if (!row) return notFound();

  return ok(toTask(row));
}

/**
 * PATCH /api/tasks/:id — sửa một phần. `completedAt` client gửi bị bỏ qua;
 * server tự đặt theo thay đổi của `status` (resolveCompletedAt).
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const existing = await prisma.task.findFirst({
    where: { id, userId: session.userId },
    select: { status: true },
  });
  if (!existing) return notFound();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }

  const result = validateTask(body as Record<string, unknown>, "patch");
  if (!result.ok) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", result.fields);
  }
  if (Object.keys(result.data).length === 0) {
    return fail(400, "VALIDATION_FAILED", "Body rỗng — không có gì để sửa.");
  }

  // Dự án đích phải thuộc về chính mình.
  if (result.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: result.data.projectId, userId: session.userId },
      select: { id: true },
    });
    if (!project) return notFound();
  }

  const completedAt = resolveCompletedAt(
    existing.status as TaskStatus,
    result.data.status,
  );

  const row = await prisma.task.update({
    where: { id },
    data: {
      ...result.data,
      // undefined = giữ nguyên; chỉ ghi khi status thật sự đổi chiều.
      ...(completedAt !== undefined ? { completedAt } : {}),
    },
    select: taskSelect,
  });

  return ok(toTask(row));
}

/** DELETE /api/tasks/:id — xoá vĩnh viễn, không hoàn tác. */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const { count } = await prisma.task.deleteMany({
    where: { id, userId: session.userId },
  });
  if (count === 0) return notFound();

  return ok({ id, deleted: true });
}
