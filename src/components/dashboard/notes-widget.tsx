import Link from "next/link";
import { NotebookPen, Plus } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import { notes } from "@/lib/mock";
import { formatTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Dot } from "@/components/ui/badge";

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

/** Ba ghi chú gần nhất, mỗi thẻ bấm vào mở trang chi tiết. */
export function NotesWidget() {
  const recent = [...notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <IconTile icon={NotebookPen} tone="violet" size="sm" />
          <h2 className="text-[15px] font-semibold text-ink">Ghi chú nhanh</h2>
        </div>
        <IconButton aria-label="Thêm ghi chú">
          <Plus size={17} />
        </IconButton>
      </div>

      <ul className="flex-1 space-y-2 px-5 pb-5">
        {recent.map((note) => (
          <li key={note.id}>
            <Link
              href={`/notes/${note.id}`}
              className="flex items-start gap-3 rounded-xl bg-surface-muted px-3.5 py-3 transition-colors hover:bg-brand-50"
            >
              <span className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-relaxed text-ink">
                {note.title}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-ink-faint">
                  {relativeLabel(note.updatedAt)}
                </span>
                <Dot tone={note.color} className="size-1.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
