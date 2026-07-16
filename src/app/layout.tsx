import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Luma — Cuộc sống rõ ràng. Ý tưởng không thất lạc.",
    template: "%s · Luma",
  },
  description:
    "Không gian quản lý cuộc sống cá nhân: lịch, công việc, ghi chú, mục tiêu, chi tiêu, thói quen, email, tài liệu — và một Second Brain lưu lại mọi thứ bạn từng đọc.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
