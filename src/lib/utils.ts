import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Gộp class Tailwind một cách an toàn: clsx xử lý điều kiện, twMerge loại bỏ
 * class xung đột (ví dụ `px-2` + `px-4` → `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Định dạng tiền Việt: 8450000 → "8.450.000 ₫" */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Định dạng số có phân cách hàng nghìn: 8450000 → "8.450.000" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** "14:30" từ một Date. */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Rút gọn text quá dài, cắt ở ranh giới từ khi có thể. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** Lấy chữ cái đầu của tên để hiện trong avatar: "Ngô Thuận" → "NT" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Định dạng kích thước file theo đơn vị thập phân (1 KB = 1000 B), giống cách
 * hệ điều hành hiển thị: 2411520 → "2,4 MB", 184320 → "184,3 KB".
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${formatNumber(bytes)} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1000;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  const formatted = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted} ${units[unitIndex]}`;
}

/** Phần trăm an toàn (không chia cho 0), kẹp trong [0, 100]. */
export function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}
