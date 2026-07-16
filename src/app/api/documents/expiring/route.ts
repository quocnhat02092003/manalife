import type { NextRequest } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { fail, ok, unauthenticated } from "@/lib/api/http";
import { requireSession } from "@/lib/api/require-session";
import { documentSelect, toDocument } from "@/lib/api/documents";

/**
 * GET /api/documents/expiring — tài liệu đã quá hạn hoặc sắp hết hạn trong
 * `withinDays` ngày tới, gần hết hạn nhất lên đầu. Không phân trang.
 *
 * Điều kiện lọc KHÔNG có cận dưới (expiresAt <= now + withinDays, hết) —
 * hộ chiếu hết hạn hôm qua là thứ người dùng cần thấy nhất, không phải thứ
 * nên giấu đi. Xem quy tắc 3 trong docs/api/documents.md.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const raw = request.nextUrl.searchParams.get("withinDays");
  let withinDays = 60; // Khớp EXPIRY_WINDOW_DAYS trong document-meta.ts.
  if (raw !== null) {
    const value = Number(raw);
    if (!Number.isInteger(value)) {
      return fail(400, "VALIDATION_FAILED", "Tham số không hợp lệ.", {
        withinDays: "withinDays phải là số nguyên.",
      });
    }
    // Ngoài khoảng thì kẹp, không báo lỗi — người dùng gõ số lạ vẫn thấy
    // một danh sách hợp lý.
    withinDays = Math.min(365, Math.max(1, value));
  }

  const cutoff = addDays(new Date(), withinDays);
  const rows = await prisma.personalDocument.findMany({
    where: {
      userId: session.userId,
      expiresAt: { not: null, lte: cutoff }, // KHÔNG có gte: new Date().
    },
    orderBy: { expiresAt: "asc" }, // Quá hạn (ngày quá khứ) lên đầu.
    select: documentSelect,
  });

  return ok(rows.map(toDocument));
}
