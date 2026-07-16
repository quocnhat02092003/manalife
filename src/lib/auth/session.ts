import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Vòng đời phiên đăng nhập — hiện thực đúng theo docs/api/auth.md:
 *
 * 1. Sinh token ngẫu nhiên 32 byte (KHÔNG dùng Math.random()).
 * 2. Gửi token thô cho client qua cookie `manalife_session`.
 * 3. Chỉ lưu SHA-256 của token vào `Session.tokenHash` — rò rỉ database thì
 *    kẻ tấn công vẫn không mạo danh được phiên nào.
 * 4. Mỗi request: băm token trong cookie rồi tra `tokenHash`, đồng thời so
 *    `expiresAt` tường minh — bản ghi hết hạn không tự vô hiệu.
 *
 * SHA-256 ở đây là đúng dù bị cấm dùng cho mật khẩu: token 32 byte ngẫu nhiên
 * không thể vét cạn nên không cần hàm băm chậm.
 */

export const SESSION_COOKIE = "manalife_session";

/** Thời hạn phiên: 30 ngày (theo docs/api/auth.md). */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Tạo phiên mới cho user, trả về token thô để đặt vào cookie.
 * Token thô KHÔNG được lưu ở bất cứ đâu ngoài cookie của người dùng.
 */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ipAddress?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    },
  });

  return { token, expiresAt };
}

/**
 * Thuộc tính cookie phiên. Ở dev trên localhost phải bỏ cờ Secure, nếu không
 * trình duyệt từ chối lưu cookie và "đăng nhập xong vẫn hỏi đăng nhập".
 */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Đọc phiên hiện tại từ cookie. Trả về null khi chưa đăng nhập, token sai
 * hoặc phiên đã hết hạn. Dùng ở Server Component / Route Handler.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        // Chọn trường tường minh — không bao giờ trả nguyên object Prisma
        // (tránh lộ passwordHash).
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });

  // `expiresAt` trong quá khứ không tự vô hiệu bản ghi — phải so tường minh.
  if (!session || session.expiresAt <= new Date()) return null;

  return session;
}
