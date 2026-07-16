import type { Expense, ExpenseCategory, EventColor } from "@/types";

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: EventColor;
  total: number;
  /** Phần trăm trên tổng chi, đã làm tròn về số nguyên. */
  share: number;
}

/** Tổng chi (không tính thu nhập) của một danh sách giao dịch. */
export function totalSpent(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.kind === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Tổng thu nhập của một danh sách giao dịch. */
export function totalIncome(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.kind === "income")
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Gom chi tiêu theo danh mục và tính tỉ lệ phần trăm.
 *
 * Phần trăm được làm tròn từng phần rồi bù phần dư vào danh mục lớn nhất, để
 * tổng luôn đúng 100% — tránh trường hợp legend hiện 34+20+15+15+15 = 99%.
 */
export function breakdownByCategory(
  expenses: Expense[],
  categories: ExpenseCategory[],
): CategoryBreakdown[] {
  const total = totalSpent(expenses);
  if (total === 0) return [];

  const rows: CategoryBreakdown[] = categories
    .map((category) => {
      const sum = expenses
        .filter((e) => e.kind === "expense" && e.categoryId === category.id)
        .reduce((acc, e) => acc + e.amount, 0);
      return {
        categoryId: category.id,
        name: category.name,
        color: category.color,
        total: sum,
        share: Math.round((sum / total) * 100),
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const drift = 100 - rows.reduce((sum, row) => sum + row.share, 0);
  if (drift !== 0 && rows.length > 0) rows[0].share += drift;

  return rows;
}
