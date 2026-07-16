import { Paperclip, Star } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import type { EmailMessage } from "@/types";
import { cn, formatTime, truncate } from "@/lib/utils";

/** "09:42" nếu là hôm nay, "Hôm qua" nếu là hôm qua, còn lại là ngày/tháng. */
function relativeLabel(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return formatTime(date);
  if (isYesterday(date)) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

interface MessageListProps {
  messages: EmailMessage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
}: MessageListProps) {
  return (
    <ul className="divide-y divide-line">
      {messages.map((message) => {
        const isSelected = message.id === selectedId;
        const hasAttachments = message.attachments.length > 0;

        return (
          <li key={message.id}>
            <button
              type="button"
              onClick={() => onSelect(message.id)}
              aria-current={isSelected ? "true" : undefined}
              className={cn(
                "w-full px-4 py-3.5 text-left transition-colors",
                isSelected ? "bg-brand-50" : "hover:bg-surface-muted",
              )}
            >
              <div className="flex items-center gap-2">
                {/* Chấm brand: dấu hiệu thư chưa đọc. */}
                {!message.read ? (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-brand-600"
                  />
                ) : null}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px]",
                    message.read
                      ? "font-medium text-ink-soft"
                      : "font-semibold text-ink",
                  )}
                >
                  {message.fromName}
                </span>
                <span className="shrink-0 text-[11px] text-ink-faint">
                  {relativeLabel(message.receivedAt)}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px]",
                    message.read ? "text-ink-soft" : "font-semibold text-ink",
                  )}
                >
                  {message.subject}
                </span>
                {hasAttachments ? (
                  <Paperclip
                    size={13}
                    className="shrink-0 text-ink-faint"
                    aria-label="Có tệp đính kèm"
                  />
                ) : null}
                {message.starred ? (
                  <Star
                    size={13}
                    fill="currentColor"
                    className="shrink-0 text-warning"
                    aria-label="Đã gắn sao"
                  />
                ) : null}
              </div>

              <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                {truncate(message.preview, 78)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
