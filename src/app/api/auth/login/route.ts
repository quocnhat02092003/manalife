import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, malformedJson, ok, readJson } from "@/lib/api/http";
import { verifyPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from "@/lib/auth/session";

/**
 * POST /api/auth/login — đăng nhập bằng email + mật khẩu, tạo phiên.
 *
 * Thông báo lỗi GIỐNG HỆT NHAU cho "email không tồn tại" và "sai mật khẩu" —
 * phân biệt là cho kẻ tấn công dò được email nào đã đăng ký. Cùng lý do,
 * email không tồn tại vẫn chạy một phép so sánh hash giả (xem password.ts)
 * để thời gian phản hồi không tố cáo điều gì.
 *
 * Không áp quy tắc độ dài mật khẩu khi đăng nhập — mật khẩu cũ có thể được
 * tạo dưới quy tắc khác. Chỉ cần kiểm tra có nhập hay chưa.
 */
export async function POST(request: NextRequest) {
  // 5 lần / 15 phút / IP — chặn dò mật khẩu bằng vét cạn chậm.
  const limited = rateLimit(`login:${clientIp(request)}`, 5, 15 * 60_000);
  if (limited) return limited;

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }
  const input = body as Record<string, unknown>;

  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  const fields: Record<string, string> = {};
  if (!email) fields.email = "Vui lòng nhập email.";
  if (!password) fields.password = "Vui lòng nhập mật khẩu.";
  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", fields);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Tài khoản chỉ có OAuth (passwordHash null) đi cùng nhánh "sai mật khẩu"
  // — verifyPassword so với hash mồi và trả false, không crash, không lộ gì.
  const valid = await verifyPassword(user?.passwordHash ?? null, password);
  if (!user || !valid) {
    return fail(401, "UNAUTHENTICATED", "Email hoặc mật khẩu không đúng.");
  }

  const { token, expiresAt } = await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const response = ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
    expiresAt,
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}
