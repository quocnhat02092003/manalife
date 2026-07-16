import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Avatar chữ cái đầu. Chưa dùng ảnh thật: khi nối API, thay bằng next/image
 * với fallback về chữ cái khi `avatarUrl` là null.
 */
export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
        size === "sm" ? "size-7 text-[11px]" : "size-9 text-[13px]",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
