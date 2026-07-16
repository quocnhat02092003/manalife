import { ArrowDownRight, ArrowUpRight, Wallet, type LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { EventColor } from "@/types";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";

interface StatCardProps {
  icon: LucideIcon;
  tone: EventColor;
  label: string;
  value: number;
  /** Cho phép số âm hiện màu danger — chỉ dùng cho thẻ "Còn lại". */
  signed?: boolean;
}

function StatCard({ icon, tone, label, value, signed = false }: StatCardProps) {
  const negative = signed && value < 0;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5">
        <IconTile icon={icon} tone={tone} size="sm" />
        <p className="text-[13px] text-ink-soft">{label}</p>
      </div>
      <p
        className={cn(
          "mt-3 text-[22px] font-semibold",
          negative ? "text-danger" : "text-ink",
        )}
      >
        {formatCurrency(value)}
      </p>
    </Card>
  );
}

interface ExpenseStatsProps {
  spent: number;
  income: number;
}

/** Ba thẻ số liệu đầu trang: Tổng chi — Tổng thu — Còn lại. */
export function ExpenseStats({ spent, income }: ExpenseStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={ArrowDownRight}
        tone="clay"
        label="Tổng chi tháng"
        value={spent}
      />
      <StatCard
        icon={ArrowUpRight}
        tone="brand"
        label="Tổng thu"
        value={income}
      />
      <StatCard
        icon={Wallet}
        tone="sand"
        label="Còn lại"
        value={income - spent}
        signed
      />
    </div>
  );
}
