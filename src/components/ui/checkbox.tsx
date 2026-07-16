"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Nhãn cho screen reader — bắt buộc vì ô tick không có text đi kèm. */
  label: string;
  className?: string;
}

/**
 * Ô tick tròn giống ảnh mẫu: rỗng khi chưa xong, tô xanh đặc + dấu check
 * khi đã xong. Dùng <button role="checkbox"> để có sẵn ngữ nghĩa a11y.
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex size-[19px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        checked
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line-strong bg-surface hover:border-brand-400",
        className,
      )}
    >
      {checked ? <Check size={12} strokeWidth={3.5} /> : null}
    </button>
  );
}
