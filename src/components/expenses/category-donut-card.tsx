import { PieChart } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/types";
import { breakdownByCategory, totalSpent } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Dot } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DonutChart } from "@/components/charts/donut-chart";

interface CategoryDonutCardProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
}

/** Tỉ lệ chi tiêu theo danh mục — donut + legend đầy đủ (tên, số tiền, %). */
export function CategoryDonutCard({
  expenses,
  categories,
}: CategoryDonutCardProps) {
  const rows = breakdownByCategory(expenses, categories);
  const total = totalSpent(expenses);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <IconTile icon={PieChart} tone="clay" size="sm" />
          <CardTitle>Cơ cấu chi tiêu</CardTitle>
        </div>
      </CardHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Chưa có khoản chi nào"
          description="Thêm giao dịch đầu tiên để xem tỉ lệ chi tiêu theo danh mục."
        />
      ) : (
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <DonutChart
              segments={rows.map((row) => ({
                id: row.categoryId,
                label: row.name,
                value: row.total,
                color: row.color,
              }))}
              size={168}
              thickness={22}
            />
            {/* Tổng chi đặt giữa vòng tròn. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-ink-faint">Tổng chi</span>
              <span className="text-[13px] font-semibold text-ink">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 space-y-3">
            {rows.map((row) => (
              <li key={row.categoryId} className="flex items-center gap-2.5">
                <Dot tone={row.color} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                  {row.name}
                </span>
                <span className="shrink-0 text-[13px] text-ink-soft">
                  {formatCurrency(row.total)}
                </span>
                <span className="w-10 shrink-0 text-right text-[13px] font-semibold text-ink">
                  {row.share}%
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
