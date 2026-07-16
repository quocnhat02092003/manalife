import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, hashToken } from "@/lib/auth/session";

/**
 * POST /api/auth/logout — xoá phiên hiện tại khỏi database và xoá cookie.
 *
 * Dùng POST chứ không phải GET: request GET không được phép thay đổi trạng
 * thái, vì trình duyệt và công cụ prefetch có thể tự gọi vào link mà người
 * dùng không hề bấm. Trang /logout là màn xác nhận; nút "Đăng xuất" mới gọi
 * endpoint này.
 *
 * Xoá phiên trong DATABASE là bắt buộc, không chỉ xoá cookie — cookie nằm ở
 * máy client, kẻ đã sao chép token vẫn dùng được nếu bản ghi phiên còn sống.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    // deleteMany thay vì delete: token không khớp bản ghi nào (đã xoá từ
    // trước, đã hết hạn bị dọn) thì logout vẫn phải thành công, không ném 500.
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
