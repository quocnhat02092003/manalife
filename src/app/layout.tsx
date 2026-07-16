import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/shadcn/sonner";
import "./globals.css";

// Inter được chọn vì có subset tiếng Việt — shadcn init từng tự đổi sang
// Geist (không có subset vi) và đã bị hoàn nguyên. Đừng để CLI đổi lại.
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "manalife — Cuộc sống rõ ràng. Ý tưởng không thất lạc.",
    template: "%s · manalife",
  },
  description:
    "Không gian quản lý cuộc sống cá nhân: lịch, công việc, ghi chú, mục tiêu, chi tiêu, thói quen, email, tài liệu — và một Second Brain lưu lại mọi thứ bạn từng đọc.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        {/* Toast toàn app (sonner qua shadcn) — gọi bằng toast.success/error. */}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
