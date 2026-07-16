import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Nút hành động chính đặt bên phải, ví dụ "Thêm công việc". */
  action?: React.ReactNode;
  className?: string;
}

/** Tiêu đề đầu mỗi trang module — giữ nhịp thống nhất giữa các trang. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 pb-6",
        className,
      )}
    >
      <div>
        <h1 className="text-[26px] font-semibold text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
