import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink",
        "placeholder:text-ink-faint",
        "transition-colors focus:border-brand-500 focus:outline-none",
        "disabled:cursor-not-allowed disabled:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink",
        "placeholder:text-ink-faint",
        "transition-colors focus:border-brand-500 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  /** Thông báo lỗi — khi có, hiện màu danger dưới input. */
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

/** Bọc label + input + lỗi thành một khối, dùng thống nhất trong mọi form. */
export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
