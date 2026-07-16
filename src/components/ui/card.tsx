import { cn } from "@/lib/utils";

/**
 * Thẻ nền trắng bo góc — đơn vị bố cục cơ bản của toàn bộ giao diện.
 * Mọi panel trong dashboard đều là một Card.
 */
export function Card({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-surface",
        className,
      )}
      {...props}
    />
  );
}

/** Hàng tiêu đề của Card: icon + tiêu đề bên trái, hành động bên phải. */
export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 px-5 pt-5 pb-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-[15px] font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-[13px] text-ink-soft", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("border-t border-line px-5 py-3.5", className)}
      {...props}
    />
  );
}
