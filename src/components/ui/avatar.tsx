import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  /** Ảnh đại diện (ví dụ từ Google) — null/vắng mặt thì hiện chữ cái đầu. */
  src?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Avatar: ảnh thật khi có `src`, fallback chữ cái đầu khi không.
 * Ảnh đến từ CDN của provider OAuth (lh3.googleusercontent.com,
 * avatars.githubusercontent.com) — dùng <img> thuần vì next/image đòi khai
 * remotePatterns cho từng domain mà không tối ưu thêm được gì với ảnh 36px.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizeClass = size === "sm" ? "size-7 text-[11px]" : "size-9 text-[13px]";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeClass,
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
