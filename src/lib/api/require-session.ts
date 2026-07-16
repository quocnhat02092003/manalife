import { getSession } from "@/lib/auth/session";

/**
 * Phiên rút gọn cho tầng API — route handler chỉ cần `userId` để lọc dữ liệu
 * (quy tắc quan trọng nhất trong docs/api/README.md: userId luôn lấy từ
 * phiên, không bao giờ từ tham số client gửi lên).
 *
 * Trả về `null` khi chưa đăng nhập — handler trả `unauthenticated()` ngay
 * dòng đầu:
 *
 *   const session = await requireSession();
 *   if (!session) return unauthenticated();
 */
export async function requireSession(): Promise<{ userId: string } | null> {
  const session = await getSession();
  if (!session) return null;
  return { userId: session.userId };
}
