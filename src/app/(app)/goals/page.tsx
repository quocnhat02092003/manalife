import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { goals } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { GoalsBoard } from "@/components/goals/goals-board";

export const metadata: Metadata = { title: "Mục tiêu" };

/** Trang Mục tiêu: bộ lọc + lưới thẻ mục tiêu kèm cột mốc. */
export default async function GoalsPage() {
  const t = await getDict();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.pages.goals.title}
        description={t.pages.goals.description}
        action={
          <Button>
            <Plus size={16} />
            Thêm mục tiêu
          </Button>
        }
      />
      <GoalsBoard goals={goals} />
    </div>
  );
}
