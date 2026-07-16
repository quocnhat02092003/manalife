import {
  Archive,
  Brain,
  Download,
  FileText,
  Forward,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import type { EmailMessage } from "@/types";
import { cn, formatFileSize, formatTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button, IconButton } from "@/components/ui/button";

/** Thời gian đầy đủ: "09:42 · Thứ Tư, 15 tháng 7, 2026" */
function fullTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return `${formatTime(date)} · ${day}`;
}

interface MessageViewProps {
  message: EmailMessage;
  onToggleStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function MessageView({
  message,
  onToggleStar,
  onArchive,
  onDelete,
}: MessageViewProps) {
  return (
    <article className="flex h-full flex-col">
      {/* Đầu thư: người gửi + các hành động nhanh. */}
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <Avatar name={message.fromName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {message.fromName}
          </p>
          <p className="truncate text-[12px] text-ink-faint">
            {message.fromEmail}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            aria-label={message.starred ? "Bỏ gắn sao" : "Gắn sao"}
            aria-pressed={message.starred}
            onClick={onToggleStar}
            className={cn(message.starred && "text-warning")}
          >
            <Star size={16} fill={message.starred ? "currentColor" : "none"} />
          </IconButton>
          <IconButton aria-label="Lưu trữ" onClick={onArchive}>
            <Archive size={16} />
          </IconButton>
          <IconButton
            aria-label="Xoá"
            onClick={onDelete}
            className="hover:bg-clay-soft hover:text-clay"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <h2 className="text-[19px] leading-snug font-semibold text-ink">
          {message.subject}
        </h2>
        <p className="mt-1.5 text-[12px] text-ink-faint">
          {fullTimestamp(message.receivedAt)}
        </p>

        {/* whitespace-pre-line: giữ nguyên xuống dòng trong body. */}
        <div className="mt-5 text-[14px] leading-[1.75] whitespace-pre-line text-ink-soft">
          {message.body}
        </div>

        {message.attachments.length > 0 ? (
          <section className="mt-6">
            <h3 className="text-[12px] font-semibold text-ink-faint">
              {message.attachments.length} tệp đính kèm
            </h3>
            <ul className="mt-2.5 space-y-2">
              {message.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-2.5"
                >
                  <span
                    aria-hidden
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
                  >
                    <FileText size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {attachment.name}
                    </span>
                    <span className="block text-[11px] text-ink-faint">
                      {formatFileSize(attachment.size)}
                    </span>
                  </span>
                  <IconButton aria-label={`Tải xuống ${attachment.name}`}>
                    <Download size={15} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Chân thư: hành động chính. "Lưu vào Second Brain" là tính năng cốt lõi. */}
      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
        <Button size="sm">
          <Reply size={15} />
          Trả lời
        </Button>
        <Button size="sm" variant="secondary">
          <Forward size={15} />
          Chuyển tiếp
        </Button>
        <Button size="sm" variant="secondary" className="ml-auto">
          <Brain size={15} />
          Lưu vào Second Brain
        </Button>
      </footer>
    </article>
  );
}
