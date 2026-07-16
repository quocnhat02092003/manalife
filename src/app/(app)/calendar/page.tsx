import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CalendarBoard } from "@/components/calendar/calendar-board";

export const metadata: Metadata = { title: "Lịch" };

/**
 * Trang giữ nguyên là server component để khai báo được `metadata`; toàn bộ
 * tương tác (chọn ngày, chuyển tháng) nằm trong CalendarBoard phía client.
 */
export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Lịch"
        description="Sự kiện, cuộc hẹn và kế hoạch theo tháng."
        action={
          <Button>
            <Plus size={16} />
            Thêm sự kiện
          </Button>
        }
      />
      <CalendarBoard />
    </div>
  );
}
