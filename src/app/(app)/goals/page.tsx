import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { goals } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { GoalsBoard } from "@/components/goals/goals-board";

export const metadata: Metadata = { title: "Mục tiêu" };

/** Trang Mục tiêu: bộ lọc + lưới thẻ mục tiêu kèm cột mốc. */
export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Mục tiêu"
        description="Mục tiêu quý, năm và các cột mốc trên đường đi."
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
