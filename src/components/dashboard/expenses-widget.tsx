import { Wallet } from "lucide-react";
import { expenseCategories, expenses } from "@/lib/mock";
import { breakdownByCategory, totalSpent } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Dot } from "@/components/ui/badge";
import { DonutChart } from "@/components/charts/donut-chart";

/**
 * Tổng chi tháng + tỉ lệ theo danh mục.
 * Cả số tổng lẫn phần trăm đều tính từ mảng `expenses` — không hard-code.
 */
export function ExpensesWidget() {
  const rows = breakdownByCategory(expenses, expenseCategories);
  const total = totalSpent(expenses);

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <IconTile icon={Wallet} tone="clay" size="sm" />
        <h2 className="text-[15px] font-semibold text-ink">Chi tiêu</h2>
      </div>

      <div className="px-5">
        <p className="text-[13px] text-ink-soft">Tổng chi tiêu tháng này</p>
        <p className="mt-0.5 text-[22px] font-semibold text-ink">
          {formatCurrency(total)}
        </p>
      </div>

      {/* Container query, không phải breakpoint màn hình: thẻ này xuất hiện ở
          cả dashboard (cột rộng) lẫn landing (cột hẹp), nên bố cục phải phản
          ứng theo bề rộng của chính nó. Hẹp thì legend xuống dưới biểu đồ,
          nếu không tên danh mục dài như "Di chuyển" sẽ bị cắt cụt. */}
      <div className="@container px-5 pt-4 pb-5">
        <div className="flex flex-col items-center gap-4 @[240px]:flex-row">
          <DonutChart
            segments={rows.map((row) => ({
              id: row.categoryId,
              label: row.name,
              value: row.total,
              color: row.color,
            }))}
            size={116}
            thickness={16}
          />
          <ul className="w-full min-w-0 flex-1 space-y-2">
            {rows.map((row) => (
              <li
                key={row.categoryId}
                className="flex items-center gap-2 text-[12px]"
              >
                <Dot tone={row.color} />
                <span className="truncate text-ink-soft">{row.name}</span>
                <span className="ml-auto shrink-0 font-medium text-ink">
                  {row.share}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
