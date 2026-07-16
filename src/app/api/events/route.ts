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
import { eventSelect, toEvent, validateEvent } from "@/lib/api/events";

const SORTABLE = ["startsAt", "title"] as const;
type SortField = (typeof SORTABLE)[number];

/**
 * GET /api/events — sự kiện của người đang đăng nhập, lọc theo khoảng ngày.
 * Lịch tháng luôn gọi kèm from/to để chỉ tải đúng tháng đang xem.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const params = request.nextUrl.searchParams;
  const fields: Record<string, string> = {};

  const from = parseDateParam(params.get("from"));
  const to = parseDateParam(params.get("to"));
  if (from === null) fields.from = "from phải là chuỗi ISO 8601.";
  if (to === null) fields.to = "to phải là chuỗi ISO 8601.";

  const rawSort = params.get("sort") ?? "startsAt";
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
  // from/to đúng định dạng nhưng ngược thứ tự → lỗi nghiệp vụ, không phải 400.
  if (from && to && to < from) {
    return fail(422, "UNPROCESSABLE", "to phải muộn hơn from.");
  }

  const q = params.get("q");
  const where = {
    userId: session.userId,
    ...(from || to
      ? { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(q
      ? {
          OR: [{ title: { contains: q } }, { description: { contains: q } }],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.calendarEvent.count({ where }),
    prisma.calendarEvent.findMany({
      where,
      orderBy: { [sortField]: desc ? "desc" : "asc" },
      skip: (page! - 1) * perPage!,
      take: perPage!,
      select: eventSelect,
    }),
  ]);

  return ok(rows.map(toEvent), {
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage!)),
    },
  });
}

/** null = sai định dạng; undefined = không gửi. */
function parseDateParam(raw: string | null): Date | null | undefined {
  if (raw === null) return undefined;
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseIntParam(raw: string | null, fallback: number): number | null {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

/** POST /api/events — tạo sự kiện mới. `userId` lấy từ phiên, `id` server sinh. */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }

  const result = validateEvent(body as Record<string, unknown>, "create");
  if (!result.ok) {
    return fail(
      result.status,
      result.status === 422 ? "UNPROCESSABLE" : "VALIDATION_FAILED",
      result.message,
      result.fields,
    );
  }

  const row = await prisma.calendarEvent.create({
    data: {
      userId: session.userId,
      title: result.data.title!,
      description: result.data.description ?? null,
      startsAt: result.data.startsAt!,
      endsAt: result.data.endsAt!,
      allDay: result.data.allDay ?? false,
      location: result.data.location ?? null,
      color: result.data.color ?? "brand",
    },
    select: eventSelect,
  });

  return ok(toEvent(row), { status: 201 });
}
