import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata: Metadata = { title: "Công việc" };

/**
 * Trang giữ nguyên là server component để khai báo `metadata`; toàn bộ
 * tương tác nằm trong TaskBoard phía client — nút "Thêm công việc" cũng ở
 * đó vì cần mở dialog.
 */
export default async function TasksPage() {
  const t = await getDict();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t.pages.tasks.title}
        description={t.pages.tasks.description}
      />
      <TaskBoard />
    </div>
  );
}
