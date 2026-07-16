import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata: Metadata = { title: "Công việc" };

/**
 * Trang giữ nguyên là server component để khai báo `metadata`; toàn bộ
 * tương tác nằm trong TaskBoard phía client — nút "Thêm công việc" cũng ở
 * đó vì cần mở dialog.
 */
export default function TasksPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Công việc"
        description="Theo dõi mọi việc cần làm, nhóm theo hạn chót."
      />
      <TaskBoard />
    </div>
  );
}
