"use client";

import { useMemo, useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Receipt, SearchX } from "lucide-react";
import type { Expense, ExpenseCategory, ExpenseKind } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Badge, Dot } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

/** "Tất cả" là giá trị lọc riêng, không phải một ExpenseKind thật. */
type KindFilter = ExpenseKind | "all";

const kindFilters: { value: KindFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "expense", label: "Chi" },
  { value: "income", label: "Thu" },
];

/** Ngày giao dịch: gần thì dùng từ tương đối, xa thì ghi ngày. */
function formatSpentAt(iso: string): string {
  const date = parseISO(iso);
  const time = format(date, "HH:mm");
  if (isToday(date)) return `Hôm nay, ${time}`;
  if (isYesterday(date)) return `Hôm qua, ${time}`;
  return format(date, "d MMM, HH:mm", { locale: vi });
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/** Nút lọc dạng viên thuốc — chỉ dùng màu phẳng. */
function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "border border-line-strong bg-surface text-ink-soft hover:bg-surface-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

interface TransactionListProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
}

/** Danh sách giao dịch gần đây + bộ lọc theo danh mục và theo loại. */
export function TransactionList({ expenses, categories }: TransactionListProps) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [categoryId, setCategoryId] = useState<string | "all">("all");

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const rows = useMemo(
    () =>
      expenses
        .filter((e) => kind === "all" || e.kind === kind)
        .filter((e) => categoryId === "all" || e.categoryId === categoryId)
        // Mới nhất lên đầu — chuỗi ISO so sánh được trực tiếp.
        .sort((a, b) => b.spentAt.localeCompare(a.spentAt)),
    [expenses, kind, categoryId],
  );

  const filtered = kind !== "all" || categoryId !== "all";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <IconTile icon={Receipt} tone="brand" size="sm" />
          <CardTitle>Giao dịch gần đây</CardTitle>
        </div>
        <span className="shrink-0 text-[12px] text-ink-faint">
          {rows.length} giao dịch
        </span>
      </CardHeader>

      {/* Bộ lọc: loại giao dịch + danh mục */}
      <div className="space-y-2.5 border-b border-line px-5 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {kindFilters.map((option) => (
            <Chip
              key={option.value}
              active={kind === option.value}
              onClick={() => setKind(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            active={categoryId === "all"}
            onClick={() => setCategoryId("all")}
          >
            Mọi danh mục
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              active={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            >
              {categoryId === category.id ? null : <Dot tone={category.color} />}
              {category.name}
            </Chip>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={filtered ? SearchX : Receipt}
          title={filtered ? "Không có giao dịch phù hợp" : "Chưa có giao dịch"}
          description={
            filtered
              ? "Thử bỏ bớt bộ lọc để xem thêm giao dịch khác."
              : "Thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu."
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row) => {
            const category = categoryById.get(row.categoryId);
            const income = row.kind === "income";
            return (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    {row.note ?? "Không có ghi chú"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {category ? (
                      <Badge tone={category.color}>{category.name}</Badge>
                    ) : null}
                    <span className="text-[12px] text-ink-faint">
                      {formatSpentAt(row.spentAt)}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    income ? "text-brand-600" : "text-ink",
                  )}
                >
                  {income ? "+" : "−"}
                  {formatCurrency(row.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
