import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarBoard } from "@/components/calendar/calendar-board";

export const metadata: Metadata = { title: "Lịch" };

/**
 * Trang giữ nguyên là server component để khai báo được `metadata`; toàn bộ
 * tương tác (chọn ngày, chuyển tháng, thêm/sửa/xoá sự kiện) nằm trong
 * CalendarBoard phía client — nút "Thêm sự kiện" cũng ở đó vì cần mở dialog.
 */
export default async function CalendarPage() {
  const t = await getDict();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.pages.calendar.title}
        description={t.pages.calendar.description}
      />
      <CalendarBoard />
    </div>
  );
}
