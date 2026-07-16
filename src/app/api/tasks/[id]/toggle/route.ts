import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { notFound, ok, unauthenticated } from "@/lib/api/http";
import { requireSession } from "@/lib/api/require-session";
import { resolveCompletedAt, taskSelect, toTask } from "@/lib/api/tasks";
import type { TaskStatus } from "@/types";

/**
 * PATCH /api/tasks/:id/toggle — lật todo ↔ done. Không có body.
 *
 * Server tự đọc trạng thái hiện tại rồi lật, nên client không cần biết
 * trạng thái là gì và không có chuyện ghi đè bằng dữ liệu cũ từ tab khác.
 * Đọc–ghi bọc trong transaction để không có khoảng trống race; câu đọc
 * cũng kèm userId trong where.
 */
export async function PATCH(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;

  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.task.findFirst({
      where: { id, userId: session.userId },
      select: { status: true },
    });
    if (!current) return null;

    const next: TaskStatus = current.status === "done" ? "todo" : "done";
    return tx.task.update({
      where: { id },
      data: {
        status: next,
        // Cùng logic completedAt với PATCH thường — một chỗ duy nhất.
        completedAt: resolveCompletedAt(current.status as TaskStatus, next),
      },
      select: taskSelect,
    });
  });

  if (!row) return notFound();
  return ok(toTask(row));
}
