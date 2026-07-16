import type { Metadata } from "next";
import { Plus, Sprout } from "lucide-react";
import { habits } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitsHeatmap } from "@/components/habits/habits-heatmap";
import { HabitsStats } from "@/components/habits/habits-stats";

export const metadata: Metadata = { title: "Thói quen" };

/**
 * Trang Thói quen: thống kê tuần, lưới thẻ từng thói quen và lưới hoàn thành
 * 7 ngày — đúng bằng khoảng thời gian có dữ liệu thật.
 */
export default function HabitsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Thói quen"
        description="Theo dõi chuỗi ngày và tiến độ tuần của từng thói quen."
        action={
          <Button>
            <Plus size={16} />
            Thêm thói quen
          </Button>
        }
      />

      {habits.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sprout}
            title="Chưa có thói quen nào"
            description="Tạo thói quen đầu tiên để bắt đầu theo dõi chuỗi ngày của bạn."
            action={
              <Button>
                <Plus size={16} />
                Thêm thói quen
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <HabitsStats />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>

          <HabitsHeatmap />
        </div>
      )}
    </div>
  );
}
