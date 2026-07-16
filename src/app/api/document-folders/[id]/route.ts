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
import { toFolder } from "@/lib/api/documents";
import type { EventColor } from "@/types";

const EVENT_COLORS: readonly EventColor[] = [
  "brand",
  "clay",
  "violet",
  "sage",
  "sand",
];

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/document-folders/:id — đổi tên hoặc màu. Mọi trường tuỳ chọn. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const existing = await prisma.documentFolder.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!existing) return notFound();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }
  const input = body as Record<string, unknown>;

  const data: { name?: string; color?: EventColor } = {};
  const fields: Record<string, string> = {};

  if ("name" in input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < 1 || name.length > 100) {
      fields.name = "Tên thư mục phải dài 1–100 ký tự.";
    } else {
      data.name = name;
    }
  }

  if ("color" in input) {
    if (EVENT_COLORS.includes(input.color as EventColor)) {
      data.color = input.color as EventColor;
    } else {
      fields.color = "Màu phải là brand | clay | violet | sage | sand.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", fields);
  }
  if (Object.keys(data).length === 0) {
    return fail(400, "VALIDATION_FAILED", "Body rỗng — không có gì để sửa.");
  }

  const row = await prisma.documentFolder.update({
    where: { id },
    data,
    select: { id: true, name: true, color: true },
  });

  return ok(toFolder(row));
}

/**
 * DELETE /api/document-folders/:id — xoá thư mục. Tài liệu bên trong KHÔNG
 * bị xoá: quan hệ dùng onDelete: SetNull, chúng chỉ mất liên kết thư mục và
 * xuất hiện ở `?folderId=none`. Thư mục chỉ là cách sắp xếp; tài liệu mới là
 * thứ có giá trị.
 */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const existing = await prisma.documentFolder.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!existing) return notFound();

  await prisma.documentFolder.delete({ where: { id: existing.id } });

  return ok({ id: existing.id, deleted: true });
}
