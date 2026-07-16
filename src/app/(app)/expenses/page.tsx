import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { expenseCategories, expenses } from "@/lib/mock";
import { totalIncome, totalSpent } from "@/lib/finance";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ExpenseStats } from "@/components/expenses/expense-stats";
import { CategoryDonutCard } from "@/components/expenses/category-donut-card";
import { BudgetCard } from "@/components/expenses/budget-card";
import { TransactionList } from "@/components/expenses/transaction-list";

export const metadata: Metadata = { title: "Chi tiêu" };

/**
 * Trang Chi tiêu.
 *
 *   ┌───────────┬───────────┬───────────┐
 *   │ Tổng chi  │ Tổng thu  │ Còn lại   │
 *   ├───────────┴─────┬─────┴───────────┤
 *   │ Cơ cấu chi tiêu │ Hạn mức tháng   │
 *   ├─────────────────┴─────────────────┤
 *   │ Giao dịch gần đây (+ bộ lọc)      │
 *   └───────────────────────────────────┘
 *
 * Trang là server component; chỉ phần lọc giao dịch cần state nên
 * `TransactionList` được tách ra thành client component.
 */
export default function ExpensesPage() {
  const spent = totalSpent(expenses);
  const income = totalIncome(expenses);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Chi tiêu"
        description="Theo dõi dòng tiền và hạn mức của bạn trong tháng này."
        action={
          <Button>
            <Plus size={16} />
            Thêm giao dịch
          </Button>
        }
      />

      <div className="space-y-4">
        <ExpenseStats spent={spent} income={income} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CategoryDonutCard
            expenses={expenses}
            categories={expenseCategories}
          />
          <BudgetCard expenses={expenses} categories={expenseCategories} />
        </div>

        <TransactionList expenses={expenses} categories={expenseCategories} />
      </div>
    </div>
  );
}
