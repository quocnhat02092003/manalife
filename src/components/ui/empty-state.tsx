import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/** Trạng thái rỗng dùng chung cho mọi danh sách chưa có dữ liệu. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
        <Icon size={20} />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] text-ink-soft">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
