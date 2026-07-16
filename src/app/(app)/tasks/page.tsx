import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata: Metadata = { title: "Công việc" };

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Công việc"
        description="Theo dõi mọi việc cần làm, nhóm theo hạn chót."
        action={
          <Button>
            <Plus size={17} />
            Thêm công việc
          </Button>
        }
      />
      <TaskBoard />
    </div>
  );
}
