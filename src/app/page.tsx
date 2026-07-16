import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { navSections } from "@/config/nav";
import { StillLife } from "@/components/marketing/still-life";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { ExpensesWidget } from "@/components/dashboard/expenses-widget";
import { NotesWidget } from "@/components/dashboard/notes-widget";
import { SecondBrainWidget } from "@/components/dashboard/second-brain-widget";

const captureKinds = [
  "Ghi chú",
  "Bookmark",
  "Video",
  "Podcast",
  "Email",
  "Tài liệu",
  "Hình ảnh",
];

/**
 * Trang giới thiệu.
 *
 * Phần hero dựng lại ảnh thiết kế: cột trái là wordmark + khẩu hiệu + hình
 * minh hoạ, cột phải là chính các widget thật của dashboard chứ không phải
 * ảnh chụp màn hình — nhờ vậy trang giới thiệu không bao giờ lệch với sản phẩm.
 */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-brand-700 p-3 sm:p-6">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-panel bg-surface-muted">
        {/* ---------------- Thanh điều hướng ---------------- */}
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="inline-flex items-baseline gap-0.5">
            <span className="text-[22px] font-bold text-brand-700">
              manalife
            </span>
            <span className="size-1.5 rounded-full bg-clay" aria-hidden />
          </span>
          <nav className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Tạo tài khoản
            </Link>
          </nav>
        </header>

        {/* ---------------- Hero ---------------- */}
        <div className="grid grid-cols-1 gap-10 px-6 pt-6 pb-12 sm:px-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:pt-10">
          <div className="flex flex-col">
            <h1 className="text-[84px] leading-[0.9] font-bold text-brand-700 sm:text-[100px]">
              manalife
            </h1>

            <p className="mt-8 text-[30px] leading-[1.25] font-semibold text-ink sm:text-[36px]">
              Cuộc sống rõ ràng.
              <br />Ý tưởng không thất lạc.
            </p>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Lịch, công việc, ghi chú, mục tiêu, chi tiêu, thói quen, email và
              tài liệu — trong một không gian duy nhất. Mọi thứ bạn từng đọc và
              lưu lại đều được kết nối trong Second Brain của riêng bạn.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-brand-700"
              >
                Bắt đầu miễn phí
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-surface px-5 text-[15px] font-medium text-ink transition-colors hover:bg-brand-50"
              >
                Xem thử giao diện
              </Link>
            </div>

            <StillLife className="mt-12 hidden w-56 text-brand-700 lg:block" />
          </div>

          {/* Lưới widget — chính là dashboard thật. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <CalendarWidget />
            </div>
            <div className="sm:col-span-3">
              <TasksWidget />
            </div>
            <div className="sm:col-span-2">
              <HabitsWidget />
            </div>
            <div className="sm:col-span-2">
              <ExpensesWidget />
            </div>
            <div className="sm:col-span-2">
              <NotesWidget />
            </div>
            <div className="sm:col-span-6">
              <SecondBrainWidget />
            </div>
          </div>
        </div>

        {/* ---------------- Các module ---------------- */}
        <section className="border-t border-line px-6 py-14 sm:px-10">
          <h2 className="text-[26px] font-semibold text-ink">
            Chín không gian, một chỗ duy nhất
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ink-soft">
            Mỗi phần đủ sâu để dùng thật, và tất cả nói chuyện được với nhau.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {navSections
              .flatMap((section) => section.items)
              .filter((item) => item.href !== "/dashboard")
              .map((item) => (
                <div
                  key={item.href}
                  className="rounded-card border border-line bg-surface p-5"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">
                    <item.icon size={18} />
                  </span>
                  <h3 className="mt-3.5 text-[15px] font-semibold text-ink">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              ))}
          </div>
        </section>

        {/* ---------------- Second Brain ---------------- */}
        <section className="border-t border-line px-6 py-14 sm:px-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-[26px] font-semibold text-ink">
                Second Brain lưu lại lịch sử của bạn
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Bảy loại nội dung, một đồ thị. Bạn lưu một bài viết hôm nay, ba
                tháng sau nó tự nằm cạnh cuốn sách bạn đang đọc và ghi chú bạn
                từng viết — vì chúng nói về cùng một thứ.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-y-2.5">
                {captureKinds.map((kind) => (
                  <li
                    key={kind}
                    className="flex items-center gap-2 text-[13px] text-ink"
                  >
                    <Check size={15} className="shrink-0 text-brand-600" />
                    {kind}
                  </li>
                ))}
              </ul>
            </div>
            <SecondBrainWidget />
          </div>
        </section>

        {/* ---------------- Kêu gọi hành động ---------------- */}
        <section className="border-t border-line px-6 py-16 text-center sm:px-10">
          <h2 className="text-[28px] font-semibold text-ink">
            Bắt đầu sắp xếp lại cuộc sống của bạn
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Miễn phí để bắt đầu. Dữ liệu là của bạn.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 text-[15px] font-medium text-white transition-colors hover:bg-brand-700"
          >
            Tạo tài khoản
            <ArrowRight size={17} />
          </Link>
        </section>

        <footer className="border-t border-line px-6 py-6 sm:px-10">
          <p className="text-[13px] text-ink-faint">
            manalife — không gian quản lý cuộc sống cá nhân.
          </p>
        </footer>
      </div>
    </div>
  );
}
