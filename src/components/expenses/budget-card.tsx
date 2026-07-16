import { Target } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/types";
import { breakdownByCategory } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";

interface BudgetCardProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
}

/** Hạn mức tháng: chỉ hiện danh mục có `monthlyBudget`. */
export function BudgetCard({ expenses, categories }: BudgetCardProps) {
  // Dùng lại breakdownByCategory để lấy số đã chi; danh mục chưa chi đồng nào
  // không có trong kết quả nên mặc định về 0.
  const spentByCategory = new Map(
    breakdownByCategory(expenses, categories).map((row) => [
      row.categoryId,
      row.total,
    ]),
  );

  const rows = categories
    .filter((category) => category.monthlyBudget !== null)
    .map((category) => {
      const spent = spentByCategory.get(category.id) ?? 0;
      const budget = category.monthlyBudget as number;
      return { category, spent, budget, over: spent > budget };
    });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <IconTile icon={Target} tone="violet" size="sm" />
          <CardTitle>Hạn mức tháng</CardTitle>
        </div>
      </CardHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Chưa đặt hạn mức"
          description="Đặt hạn mức cho từng danh mục để theo dõi mức chi mỗi tháng."
        />
      ) : (
        <CardContent className="space-y-4">
          {rows.map(({ category, spent, budget, over }) => (
            <div key={category.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-ink">
                  {category.name}
                </span>
                {over ? <Badge tone="clay">Vượt hạn mức</Badge> : null}
                <span className="ml-auto shrink-0 text-[12px] text-ink-soft">
                  <span className={over ? "font-medium text-danger" : "text-ink"}>
                    {formatCurrency(spent)}
                  </span>
                  {" / "}
                  {formatCurrency(budget)}
                </span>
              </div>
              <Progress
                className="mt-2"
                value={spent}
                total={budget}
                tone={over ? "danger" : category.color}
                label={`${category.name}: đã chi ${formatCurrency(spent)} trên hạn mức ${formatCurrency(budget)}`}
              />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
