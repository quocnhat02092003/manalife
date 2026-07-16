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
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskSelect,
  toTask,
  validateTask,
} from "@/lib/api/tasks";

const SORTABLE = ["createdAt", "dueAt", "priority", "title"] as const;
type SortField = (typeof SORTABLE)[number];

/**
 * GET /api/tasks — việc của người đang đăng nhập, lọc theo trạng thái /
 * dự án / độ ưu tiên / hạn. Các bộ lọc kết hợp bằng AND.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const params = request.nextUrl.searchParams;
  const fields: Record<string, string> = {};

  const status = params.get("status");
  if (status !== null && !TASK_STATUSES.includes(status as never)) {
    fields.status = "status phải là todo | done.";
  }
  const priority = params.get("priority");
  if (priority !== null && !TASK_PRIORITIES.includes(priority as never)) {
    fields.priority = "priority phải là low | medium | high.";
  }

  const rawDueBefore = params.get("dueBefore");
  let dueBefore: Date | undefined;
  if (rawDueBefore !== null) {
    dueBefore = new Date(rawDueBefore);
    if (Number.isNaN(dueBefore.getTime())) {
      fields.dueBefore = "dueBefore phải là chuỗi ISO 8601.";
    }
  }

  // dueAfter + dueBefore = khoảng hạn — lịch tháng dùng cặp này để chỉ lấy
  // việc đến hạn trong lưới đang xem. Cũng như dueBefore, việc không có hạn
  // bị loại (gte không khớp null).
  const rawDueAfter = params.get("dueAfter");
  let dueAfter: Date | undefined;
  if (rawDueAfter !== null) {
    dueAfter = new Date(rawDueAfter);
    if (Number.isNaN(dueAfter.getTime())) {
      fields.dueAfter = "dueAfter phải là chuỗi ISO 8601.";
    }
  }

  const rawSort = params.get("sort") ?? "-createdAt";
  const desc = rawSort.startsWith("-");
  const sortField = (desc ? rawSort.slice(1) : rawSort) as SortField;
  if (!SORTABLE.includes(sortField)) {
    fields.sort = "Trường sắp xếp không được hỗ trợ.";
  }

  const page = parseIntParam(params.get("page"), 1);
  const perPage = parseIntParam(params.get("perPage"), 20);
  if (page === null) fields.page = "page phải là số nguyên dương.";
  if (perPage === null) fields.perPage = "perPage phải là số nguyên dương.";

  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Tham số không hợp lệ.", fields);
  }

  // `projectId=none` là token cho "chưa gán dự án" — map sang null, đừng
  // để lọt nguyên văn vào Prisma rồi đi tìm dự án tên "none".
  const projectId = params.get("projectId");
  const q = params.get("q");

  const where = {
    userId: session.userId,
    ...(status ? { status } : {}),
    ...(projectId !== null
      ? { projectId: projectId === "none" ? null : projectId }
      : {}),
    ...(priority ? { priority } : {}),
    // `lt`/`gte` tự loại dueAt null — đúng ý: việc không hạn không bao giờ
    // "sắp đến hạn" và không xuất hiện trên lịch.
    ...(dueBefore || dueAfter
      ? {
          dueAt: {
            ...(dueBefore ? { lt: dueBefore } : {}),
            ...(dueAfter ? { gte: dueAfter } : {}),
          },
        }
      : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { notes: { contains: q } }] } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { [sortField]: desc ? "desc" : "asc" },
      skip: (page! - 1) * perPage!,
      take: perPage!,
      select: taskSelect,
    }),
  ]);

  return ok(rows.map(toTask), {
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage!)),
    },
  });
}

function parseIntParam(raw: string | null, fallback: number): number | null {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

/** POST /api/tasks — tạo việc mới. `completedAt` do server quản (quy tắc 1). */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }

  const result = validateTask(body as Record<string, unknown>, "create");
  if (!result.ok) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", result.fields);
  }

  // Dự án đích phải là của chính mình — id dự án là bản ghi khác, `userId`
  // trong where của Task không bảo vệ nó.
  if (result.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: result.data.projectId, userId: session.userId },
      select: { id: true },
    });
    if (!project) return notFound();
  }

  const status = result.data.status ?? "todo";
  const row = await prisma.task.create({
    data: {
      userId: session.userId,
      title: result.data.title!,
      notes: result.data.notes ?? null,
      status,
      priority: result.data.priority ?? "medium",
      dueAt: result.data.dueAt ?? null,
      projectId: result.data.projectId ?? null,
      // Tạo thẳng với status done cũng phải giữ bất biến done ⟺ completedAt.
      completedAt: status === "done" ? new Date() : null,
    },
    select: taskSelect,
  });

  return ok(toTask(row), { status: 201 });
}
