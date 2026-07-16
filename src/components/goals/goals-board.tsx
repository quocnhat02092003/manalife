"use client";

import { useMemo, useState } from "react";
import { Target } from "lucide-react";
import type { Goal, GoalHorizon, GoalStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard, horizonLabels, statusLabels } from "./goal-card";

/** "all" là lựa chọn mặc định của bộ lọc khung thời gian. */
type HorizonFilter = GoalHorizon | "all";

const horizonOptions: { value: HorizonFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "quarter", label: horizonLabels.quarter },
  { value: "year", label: horizonLabels.year },
  { value: "life", label: horizonLabels.life },
];

const statusOptions: { value: GoalStatus; label: string }[] = [
  { value: "active", label: statusLabels.active },
  { value: "done", label: statusLabels.done },
  { value: "paused", label: statusLabels.paused },
];

interface FilterPillsProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Một hàng nút lọc — chỉ chọn được một giá trị tại một thời điểm. */
function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterPillsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Button
            key={option.value}
            size="sm"
            variant={active ? "primary" : "secondary"}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Danh sách mục tiêu kèm bộ lọc. Giữ state ở đây để trang bọc ngoài vẫn là
 * server component (xem src/app/(app)/goals/page.tsx).
 */
export function GoalsBoard({ goals }: { goals: Goal[] }) {
  const [horizon, setHorizon] = useState<HorizonFilter>("all");
  const [status, setStatus] = useState<GoalStatus>("active");

  const visible = useMemo(
    () =>
      goals.filter(
        (goal) =>
          (horizon === "all" || goal.horizon === horizon) && goal.status === status,
      ),
    [goals, horizon, status],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-5">
        <FilterPills
          label="Lọc theo khung thời gian"
          options={horizonOptions}
          value={horizon}
          onChange={setHorizon}
        />
        <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
        <FilterPills
          label="Lọc theo trạng thái"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
        <p className="ml-auto text-[13px] text-ink-soft" aria-live="polite">
          {visible.length} mục tiêu
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Target}
            title="Chưa có mục tiêu nào ở đây"
            description="Không có mục tiêu nào khớp bộ lọc hiện tại. Thử đổi khung thời gian hoặc trạng thái."
          />
        </Card>
      )}
    </div>
  );
}
