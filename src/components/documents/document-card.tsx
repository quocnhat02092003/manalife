import { CalendarDays, CalendarClock, Trash2 } from "lucide-react";
import type { PersonalDocument } from "@/types";
import { cn, formatFileSize } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import {
  documentKindMeta,
  expiryChipClass,
  formatDay,
  getExpiryInfo,
} from "./document-meta";

/** Chip số ngày còn lại — chỉ hiện khi tài liệu nằm trong cửa sổ cảnh báo. */
function ExpiryChip({ doc }: { doc: PersonalDocument }) {
  const expiry = getExpiryInfo(doc);
  if (!expiry) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        expiryChipClass[expiry.level],
      )}
    >
      {expiry.label}
    </span>
  );
}

/** Dòng "Hết hạn dd/mm/yyyy" ở chân thẻ, cho tài liệu có hạn. */
function ExpiryLine({ expiresAt }: { expiresAt: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <CalendarClock size={12} aria-hidden />
      Hết hạn {formatDay(expiresAt)}
    </span>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </div>
  );
}

/** Nút xoá nhỏ ở góc thẻ — chỉ hiện khi component cha truyền onDelete. */
function DeleteButton({
  name,
  onDelete,
}: {
  name: string;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDelete}
      aria-label={`Xoá "${name}"`}
      className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 size={15} />
    </button>
  );
}

/**
 * Xem trước cho ảnh và video — hai loại này trình duyệt hiển thị trực tiếp
 * được. File lấy từ endpoint có kiểm tra quyền sở hữu, không phải URL công
 * khai.
 */
function MediaPreview({ doc }: { doc: PersonalDocument }) {
  const src = `/api/documents/${doc.id}/file`;

  if (doc.kind === "image") {
    // Ảnh riêng tư phục vụ qua API nội bộ có kiểm tra phiên — next/image
    // không tối ưu thêm được gì ở đây.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={doc.name}
        loading="lazy"
        className="mt-3 h-36 w-full rounded-lg border border-line object-cover"
      />
    );
  }
  if (doc.kind === "video") {
    return (
      <video
        src={src}
        controls
        preload="metadata"
        className="mt-3 h-36 w-full rounded-lg border border-line bg-ink object-contain"
      />
    );
  }
  return null;
}

/** Thẻ tài liệu ở chế độ lưới. */
export function DocumentCard({
  doc,
  onDelete,
}: {
  doc: PersonalDocument;
  onDelete?: () => void;
}) {
  const meta = documentKindMeta[doc.kind];

  return (
    <Card className="flex flex-col p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <IconTile icon={meta.icon} tone={meta.tone} size="md" />
        <div className="flex items-center gap-1">
          <ExpiryChip doc={doc} />
          {onDelete ? <DeleteButton name={doc.name} onDelete={onDelete} /> : null}
        </div>
      </div>

      <MediaPreview doc={doc} />

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed font-medium text-ink">
        {doc.name}
      </p>
      <p className="mt-1 text-[11px] text-ink-faint">
        {meta.label} · {formatFileSize(doc.size)}
      </p>

      <div className="mt-3">
        <TagList tags={doc.tags} />
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-3 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={12} aria-hidden />
          Thêm ngày {formatDay(doc.createdAt)}
        </span>
        {doc.expiresAt ? <ExpiryLine expiresAt={doc.expiresAt} /> : null}
      </div>
    </Card>
  );
}

/** Một dòng tài liệu ở chế độ danh sách. */
export function DocumentRow({
  doc,
  onDelete,
}: {
  doc: PersonalDocument;
  onDelete?: () => void;
}) {
  const meta = documentKindMeta[doc.kind];

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted">
      <IconTile icon={meta.icon} tone={meta.tone} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-ink">{doc.name}</p>
          <ExpiryChip doc={doc} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-faint">
          <span>
            {meta.label} · {formatFileSize(doc.size)}
          </span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            <CalendarDays size={12} aria-hidden />
            {formatDay(doc.createdAt)}
          </span>
          {doc.expiresAt ? (
            <>
              <span aria-hidden>·</span>
              <ExpiryLine expiresAt={doc.expiresAt} />
            </>
          ) : null}
        </div>
      </div>

      <div className="hidden shrink-0 md:block">
        <TagList tags={doc.tags} />
      </div>

      {onDelete ? <DeleteButton name={doc.name} onDelete={onDelete} /> : null}
    </div>
  );
}
