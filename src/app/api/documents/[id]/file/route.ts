import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { notFound, unauthenticated } from "@/lib/api/http";
import { requireSession } from "@/lib/api/require-session";
import { openFileStream } from "@/lib/storage";

/**
 * GET /api/documents/:id/file — trả nội dung file, sau khi kiểm tra quyền
 * sở hữu. `storageKey` không bao giờ lộ ra ngoài; client chỉ biết id.
 *
 * `Content-Disposition`:
 * - `inline` CHỈ cho image/* và video/* trong danh sách trắng (không có SVG)
 *   — để xem trước ảnh/video ngay trong app. Hai nhóm này trình duyệt render
 *   bằng bộ giải mã media thuần, không chạy được script.
 * - `attachment` cho mọi loại còn lại — PDF có JavaScript nhúng, không để
 *   trình duyệt render file của người dùng trong ngữ cảnh domain của mình.
 *
 * `X-Content-Type-Options: nosniff` luôn bật để trình duyệt không tự đoán
 * lại kiểu nội dung.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const { id } = await ctx.params;
  const row = await prisma.personalDocument.findFirst({
    where: { id, userId: session.userId },
    select: { name: true, mimeType: true, storageKey: true },
  });
  if (!row?.storageKey) return notFound();

  const file = await openFileStream(row.storageKey);
  if (!file) return notFound();

  const mime = row.mimeType ?? "application/octet-stream";
  const inline = mime.startsWith("image/") || mime.startsWith("video/");

  // Tên file trong header phải là ASCII an toàn; tên đầy đủ (UTF-8) đi qua
  // filename* theo RFC 5987.
  const asciiName = row.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");

  return new Response(file.stream, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(file.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(row.name)}`,
      "X-Content-Type-Options": "nosniff",
      // File là bất biến (PATCH không đổi được nội dung) — cache riêng tư
      // thoải mái, đỡ tải lại preview mỗi lần chuyển trang.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
