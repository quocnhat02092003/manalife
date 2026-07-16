import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LogoutPanel } from "@/components/auth/logout-panel";

export const metadata: Metadata = { title: "Đăng xuất" };

/**
 * Trang xác nhận đăng xuất.
 *
 * Có màn xác nhận thay vì đăng xuất ngay khi truy cập, vì một request GET
 * không được phép gây thay đổi trạng thái — trình duyệt và công cụ prefetch
 * có thể gọi vào link này mà người dùng không hề bấm.
 */
export default async function LogoutPage() {
  const session = await getSession();
  // Chưa đăng nhập thì không có gì để thoát.
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-muted px-6">
      <LogoutPanel
        user={{
          name: session.user.name,
          email: session.user.email,
          avatarUrl: session.user.avatarUrl,
        }}
      />
    </div>
  );
}
