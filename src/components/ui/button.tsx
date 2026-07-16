import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Màu phẳng, không gradient (quy tắc #1 trong docs/ui-guidelines.md).
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
  ghost: "text-ink-soft hover:bg-brand-50 hover:text-brand-700",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-9.5 gap-2 rounded-lg px-4 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-[15px]",
};

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/**
 * Nút chỉ có icon — dùng cho "+" ở góc thẻ và mũi tên chuyển tháng.
 * Bắt buộc có `aria-label` vì không có text để screen reader đọc.
 */
export function IconButton({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-ink-soft",
        "transition-colors hover:bg-brand-50 hover:text-brand-700",
        className,
      )}
      {...props}
    />
  );
}
