import { ExternalLink, Link2, Star } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import type { Capture } from "@/types";
import { captureTypeLabels } from "@/lib/mock/second-brain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { captureMeta } from "./capture-meta";

/** "Hôm nay" / "Hôm qua" cho nội dung mới lưu, còn lại là ngày/tháng/năm. */
function savedLabel(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Hôm nay";
  if (isYesterday(date)) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Một thẻ nội dung đã lưu trong lưới Second Brain. */
export function CaptureCard({ capture }: { capture: Capture }) {
  const { icon, tone } = captureMeta[capture.type];
  const linkedCount = capture.linkedIds.length;

  return (
    <Card className="flex h-full flex-col p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-2.5">
        <IconTile icon={icon} tone={tone} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ink-soft">
            {captureTypeLabels[capture.type]}
          </p>
          {capture.sourceName ? (
            <p className="truncate text-[11px] text-ink-faint">
              {capture.sourceName}
            </p>
          ) : null}
        </div>
        {capture.starred ? (
          <Star
            size={15}
            fill="currentColor"
            aria-label="Đã đánh dấu sao"
            className="mt-0.5 shrink-0 text-brand-600"
          />
        ) : null}
      </div>

      <h3 className="mt-3 text-sm leading-snug font-semibold text-ink">
        {capture.title}
      </h3>

      {capture.excerpt ? (
        <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">
          {capture.excerpt}
        </p>
      ) : null}

      {capture.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {capture.tags.map((tag) => (
            <Badge key={tag} tone={tone}>
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* `mt-auto` ghim chân thẻ xuống đáy để các thẻ cùng hàng thẳng nhau. */}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-3.5">
        <p className="text-[11px] text-ink-faint">{savedLabel(capture.createdAt)}</p>

        <div className="ml-auto flex items-center gap-2">
          {linkedCount > 0 ? (
            <Badge tone="neutral">
              <Link2 size={11} aria-hidden />
              {linkedCount} liên kết
            </Badge>
          ) : null}

          {capture.sourceUrl ? (
            <a
              href={capture.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-brand-700 transition-colors hover:bg-brand-50"
            >
              Mở nguồn
              <ExternalLink size={12} aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
