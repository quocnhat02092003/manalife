import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, malformedJson, ok, readJson } from "@/lib/api/http";
import { hashPassword } from "@/lib/auth/password";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from "@/lib/auth/session";

/** Đúng pattern của client trong src/lib/validation.ts — server kiểm tra lại y hệt. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/auth/register — tạo tài khoản và đăng nhập luôn.
 * Response 201 không bao giờ chứa passwordHash — chọn trường tường minh.
 */
export async function POST(request: NextRequest) {
  // 5 lần / 15 phút / IP — chặn tạo tài khoản hàng loạt.
  const limited = rateLimit(`register:${clientIp(request)}`, 5, 15 * 60_000);
  if (limited) return limited;

  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return malformedJson();
  }
  const input = body as Record<string, unknown>;

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Tên quá ngắn.";
  if (!EMAIL_PATTERN.test(email)) fields.email = "Email không hợp lệ.";
  if (password.length < 8) fields.password = "Mật khẩu cần ít nhất 8 ký tự.";
  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", fields);
  }

  // Email đã chuẩn hoá chữ thường ở trên — bắt buộc, nếu không
  // Thuan@x.vn và thuan@x.vn thành hai tài khoản và @unique không ngăn được.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return fail(409, "CONFLICT", "Email đã được đăng ký.", {
      email: "Email này đã có tài khoản. Bạn có thể đăng nhập.",
    });
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  const { token, expiresAt } = await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const response = ok(
    { user: { ...user, createdAt: user.createdAt.toISOString() }, expiresAt },
    { status: 201 },
  );
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}
