import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

/**
 * Khung của toàn bộ khu vực đã đăng nhập.
 *
 * Session được kiểm tra phía server ngay tại đây — chưa đăng nhập thì không
 * trang nào bên trong render được, kể cả khi client tắt JavaScript. Từng
 * route handler /api vẫn tự kiểm tra lại: chặn ở tầng trang là trải nghiệm,
 * chặn ở tầng API mới là an toàn.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <Sidebar user={session.user} className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={session.user} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
