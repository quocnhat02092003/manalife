import Link from "next/link";
import { StillLife } from "@/components/marketing/still-life";

/**
 * Khung hai cột cho login/register: cột trái là thương hiệu (ẩn trên mobile),
 * cột phải là form.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Cột thương hiệu */}
      <div className="relative hidden flex-col justify-between bg-brand-700 p-10 lg:flex">
        <Link href="/" className="inline-flex items-baseline gap-0.5">
          <span className="text-[22px] font-bold text-white">manalife</span>
          <span className="size-1.5 rounded-full bg-clay" aria-hidden />
        </Link>

        <div>
          <p className="text-[34px] leading-[1.25] font-semibold text-white">
            Cuộc sống rõ ràng.
            <br />Ý tưởng không thất lạc.
          </p>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-brand-200">
            Lịch, công việc, ghi chú, mục tiêu, chi tiêu, thói quen, email và
            tài liệu — cùng một Second Brain lưu lại mọi thứ bạn từng đọc.
          </p>
        </div>

        <StillLife className="w-48 text-brand-400" />
      </div>

      {/* Cột form */}
      <div className="flex flex-col justify-center bg-surface-muted px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-baseline gap-0.5 lg:hidden"
          >
            <span className="text-[22px] font-bold text-brand-700">
              manalife
            </span>
            <span className="size-1.5 rounded-full bg-clay" aria-hidden />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
