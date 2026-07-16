import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  fail,
  malformedJson,
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

/**
 * GET /api/document-folders — toàn bộ thư mục của người dùng. Không phân
 * trang: số thư mục theo bản chất là nhỏ và cột trái giao diện cần cả danh
 * sách cùng lúc.
 */
export async function GET() {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const rows = await prisma.documentFolder.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  return ok(rows.map(toFolder));
}

/**
 * POST /api/document-folders — tạo thư mục. Tên KHÔNG yêu cầu duy nhất
 * (schema không có @@unique) — hai thư mục cùng tên là hợp lệ, không trả 409.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }
  const input = body as Record<string, unknown>;

  const fields: Record<string, string> = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1 || name.length > 100) {
    fields.name = "Tên thư mục phải dài 1–100 ký tự.";
  }

  let color: EventColor = "brand";
  if (input.color !== undefined) {
    if (EVENT_COLORS.includes(input.color as EventColor)) {
      color = input.color as EventColor;
    } else {
      fields.color = "Màu phải là brand | clay | violet | sage | sand.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", fields);
  }

  const row = await prisma.documentFolder.create({
    data: { userId: session.userId, name, color },
    select: { id: true, name: true, color: true },
  });

  return ok(toFolder(row), { status: 201 });
}
