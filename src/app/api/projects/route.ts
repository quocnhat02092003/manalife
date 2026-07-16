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
import { toProject } from "@/lib/api/tasks";
import { EVENT_COLORS } from "@/lib/api/events";
import type { EventColor } from "@/types";

/**
 * GET /api/projects — toàn bộ dự án của người dùng. Số lượng nhỏ (đổ bộ lọc
 * và dropdown) nên trả hết, không phân trang.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const sort = request.nextUrl.searchParams.get("sort") ?? "name";
  if (sort !== "name") {
    return fail(400, "VALIDATION_FAILED", "Tham số không hợp lệ.", {
      sort: "Chỉ hỗ trợ sort=name.",
    });
  }

  const rows = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  return ok(rows.map(toProject));
}

/** POST /api/projects — tạo dự án mới. */
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
    fields.name = "Tên dự án phải dài 1–100 ký tự.";
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

  const row = await prisma.project.create({
    data: { userId: session.userId, name, color },
    select: { id: true, name: true, color: true },
  });

  return ok(toProject(row), { status: 201 });
}
