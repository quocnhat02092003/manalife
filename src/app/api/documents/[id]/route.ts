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
  documentSelect,
  sanitizeTags,
  toDocument,
} from "@/lib/api/documents";
import { deleteFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/documents/:id — chi tiết một tài liệu. */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const row = await prisma.personalDocument.findFirst({
    where: { id, userId: session.userId },
    select: documentSelect,
  });
  if (!row) return notFound();

  return ok(toDocument(row));
}

/**
 * PATCH /api/documents/:id — sửa metadata: tên, thư mục, tag, ngày hết hạn.
 * Không sửa được file/size/kind/storageKey — nội dung file là bất biến.
 * `tags` là thay thế toàn bộ, không phải thêm vào.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const existing = await prisma.personalDocument.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!existing) return notFound();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }
  const input = body as Record<string, unknown>;

  const data: {
    name?: string;
    folderId?: string | null;
    tags?: string;
    expiresAt?: Date | null;
  } = {};
  const fields: Record<string, string> = {};

  if ("name" in input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < 1 || name.length > 200) {
      fields.name = "Tên hiển thị phải dài 1–200 ký tự.";
    } else {
      data.name = name;
    }
  }

  if ("tags" in input) {
    const tags = sanitizeTags(input.tags);
    if (tags === null) {
      fields.tags = "tags phải là mảng chuỗi, mỗi tag 1–50 ký tự.";
    } else {
      data.tags = JSON.stringify(tags);
    }
  }

  if ("expiresAt" in input) {
    if (input.expiresAt === null) {
      data.expiresAt = null;
    } else if (typeof input.expiresAt === "string") {
      const date = new Date(input.expiresAt);
      if (Number.isNaN(date.getTime())) {
        fields.expiresAt = "Ngày hết hạn phải theo định dạng ISO 8601.";
      } else {
        data.expiresAt = date;
      }
    } else {
      fields.expiresAt = "expiresAt phải là chuỗi ISO 8601 hoặc null.";
    }
  }

  if ("folderId" in input) {
    if (input.folderId === null) {
      data.folderId = null;
    } else if (typeof input.folderId === "string") {
      // Thư mục đích phải thuộc về chính mình.
      const folder = await prisma.documentFolder.findFirst({
        where: { id: input.folderId, userId: session.userId },
        select: { id: true },
      });
      if (!folder) return notFound();
      data.folderId = folder.id;
    } else {
      fields.folderId = "folderId phải là chuỗi hoặc null.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", fields);
  }
  if (Object.keys(data).length === 0) {
    return fail(400, "VALIDATION_FAILED", "Body rỗng — không có gì để sửa.");
  }

  const row = await prisma.personalDocument.update({
    where: { id },
    data,
    select: documentSelect,
  });

  return ok(toDocument(row));
}

/**
 * DELETE /api/documents/:id — xoá vĩnh viễn tài liệu VÀ file trong kho.
 *
 * Thứ tự: xoá dòng database TRƯỚC, xoá file SAU — sau khi database commit,
 * file mồ côi là rác vô hại; ngược lại thì bản ghi trỏ vào hư không. Xoá file
 * thất bại chỉ ghi log: người dùng đã yêu cầu xoá, lỗi storage không phải
 * lý do để từ chối.
 */
export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const row = await prisma.personalDocument.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, storageKey: true },
  });
  if (!row) return notFound();

  await prisma.personalDocument.delete({ where: { id: row.id } });
  if (row.storageKey) await deleteFile(row.storageKey);

  return ok({ id: row.id, deleted: true });
}
