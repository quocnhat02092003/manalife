import Link from "next/link";
import { Pin } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import type { Note } from "@/types";
import { formatTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";

/** "10:15" nếu là hôm nay, "Hôm qua" nếu là hôm qua, còn lại là ngày/tháng. */
function relativeLabel(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return formatTime(date);
  if (isYesterday(date)) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

/**
 * Trích đoạn phẳng từ body Markdown: bỏ dấu gạch đầu dòng và dấu nhấn `*`
 * để phần xem trước trên thẻ chỉ còn chữ.
 */
function excerptOf(body: string): string {
  return body
    .split("\n")
    .map((line) => line.trim().replace(/^-\s+/, "").replace(/\*/g, ""))
    .filter(Boolean)
    .join(" ");
}

/** Một thẻ ghi chú trong lưới — bấm vào mở trang chi tiết. */
export function NoteCard({ note }: { note: Note }) {
  return (
    <Link href={`/notes/${note.id}`} className="mb-4 block break-inside-avoid">
      <Card className="p-4 transition-colors hover:border-line-strong hover:bg-surface-muted">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-sm font-semibold text-ink">
            {note.title}
          </h2>
          {note.pinned ? (
            <Pin
              size={15}
              className="mt-0.5 shrink-0 text-brand-600"
              aria-label="Đã ghim"
            />
          ) : (
            <Dot tone={note.color} className="mt-1.5 size-1.5" />
          )}
        </div>

        <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-ink-soft">
          {excerptOf(note.body)}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {note.tags.map((tag) => (
            <Badge key={tag} tone={note.color}>
              {tag}
            </Badge>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-ink-faint">
          {relativeLabel(note.updatedAt)}
        </p>
      </Card>
    </Link>
  );
}
