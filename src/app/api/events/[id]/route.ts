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
import { eventSelect, toEvent, validateEvent } from "@/lib/api/events";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/events/:id — chi tiết một sự kiện. */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const row = await prisma.calendarEvent.findFirst({
    where: { id, userId: session.userId },
    select: eventSelect,
  });
  if (!row) return notFound();

  return ok(toEvent(row));
}

/**
 * PATCH /api/events/:id — sửa một phần. Trường vắng mặt giữ nguyên; quy tắc
 * "endsAt sau startsAt" kiểm tra trên giá trị sau khi ghép với bản ghi cũ.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const existing = await prisma.calendarEvent.findFirst({
    where: { id, userId: session.userId },
    select: { startsAt: true, endsAt: true, allDay: true },
  });
  if (!existing) return notFound();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }

  const result = validateEvent(
    body as Record<string, unknown>,
    "patch",
    existing,
  );
  if (!result.ok) {
    return fail(
      result.status,
      result.status === 422 ? "UNPROCESSABLE" : "VALIDATION_FAILED",
      result.message,
      result.fields,
    );
  }

  const row = await prisma.calendarEvent.update({
    where: { id },
    data: result.data,
    select: eventSelect,
  });

  return ok(toEvent(row));
}

/** DELETE /api/events/:id — xoá vĩnh viễn, không có thùng rác. */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  // deleteMany kèm userId rồi soi count — không cần query kiểm tra riêng.
  const { count } = await prisma.calendarEvent.deleteMany({
    where: { id, userId: session.userId },
  });
  if (count === 0) return notFound();

  return ok({ id, deleted: true });
}
