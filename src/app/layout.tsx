import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/shadcn/sonner";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Ngôn ngữ từ cookie — server render đúng ngôn ngữ ngay lượt đầu,
  // LocaleProvider đưa cùng giá trị xuống cây client. Xem src/lib/i18n/.
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        {/* Toast toàn app (sonner qua shadcn) — gọi bằng toast.success/error. */}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
