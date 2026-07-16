import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-6 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Compass size={24} />
      </span>
      <h1 className="mt-5 text-[28px] font-semibold text-ink">
        Không tìm thấy trang
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        Trang bạn tìm không tồn tại hoặc đã được chuyển đi nơi khác.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Về Tổng quan
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-brand-50"
        >
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
