import type { Metadata } from "next";
import { currentUser } from "@/lib/mock";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { ExpensesWidget } from "@/components/dashboard/expenses-widget";
import { NotesWidget } from "@/components/dashboard/notes-widget";
import { SecondBrainWidget } from "@/components/dashboard/second-brain-widget";

export const metadata: Metadata = { title: "Tổng quan" };

/** Lời chào đổi theo giờ trong ngày. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/**
 * Bố cục lưới tái hiện ảnh mẫu:
 *
 *   ┌───────────┬───────────────────────┐
 *   │  Lịch     │  Công việc            │
 *   ├───────┬───┴───┬───────────────────┤
 *   │ Thói  │ Chi   │  Ghi chú nhanh    │
 *   │ quen  │ tiêu  │                   │
 *   ├───────┴───────┴───────────────────┤
 *   │  Second Brain (tràn hết chiều rộng)│
 *   └───────────────────────────────────┘
 *
 * Dưới lg tất cả xếp thành một cột.
 */
export default function DashboardPage() {
  const firstName = currentUser.name.split(" ").at(-1);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="pb-6">
        <h1 className="text-[26px] font-semibold text-ink">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Đây là toàn cảnh ngày hôm nay của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="lg:col-span-3">
          <CalendarWidget />
        </div>
        <div className="lg:col-span-3">
          <TasksWidget />
        </div>

        <div className="lg:col-span-2">
          <HabitsWidget />
        </div>
        <div className="lg:col-span-2">
          <ExpensesWidget />
        </div>
        <div className="lg:col-span-2">
          <NotesWidget />
        </div>

        <div className="lg:col-span-6">
          <SecondBrainWidget />
        </div>
      </div>
    </div>
  );
}
