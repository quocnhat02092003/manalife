import { TriangleAlert } from "lucide-react";
import type { DocumentFolder, PersonalDocument } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import {
  documentKindMeta,
  expiryChipClass,
  EXPIRY_WINDOW_DAYS,
  formatDay,
  getExpiryInfo,
  type ExpiryInfo,
} from "./document-meta";

interface ExpiringSoonProps {
  documents: PersonalDocument[];
  folders: DocumentFolder[];
}

/**
 * Thẻ nhắc gia hạn: hộ chiếu, bảo hiểm, hợp đồng sắp hết hạn trong 60 ngày tới.
 * Gấp nhất lên trước. Không có gì sắp hết hạn thì thẻ tự ẩn.
 */
export function ExpiringSoon({ documents, folders }: ExpiringSoonProps) {
  const items = documents
    .map((doc) => ({ doc, expiry: getExpiryInfo(doc) }))
    .filter((item): item is { doc: PersonalDocument; expiry: ExpiryInfo } =>
      item.expiry !== null,
    )
    .sort((a, b) => a.expiry.days - b.expiry.days);

  if (items.length === 0) return null;

  const folderName = (id: string | null) =>
    folders.find((folder) => folder.id === id)?.name ?? "Chưa phân loại";

  return (
    <Card className="mb-5 border-danger/30">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-[10px] bg-danger text-white"
          >
            <TriangleAlert size={18} strokeWidth={2} />
          </span>
          <div>
            <CardTitle>Sắp hết hạn</CardTitle>
            <CardDescription>
              {items.length} tài liệu cần gia hạn trong {EXPIRY_WINDOW_DAYS} ngày
              tới.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {items.map(({ doc, expiry }) => {
            const meta = documentKindMeta[doc.kind];
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-xl bg-surface-muted px-3.5 py-2.5"
              >
                <IconTile icon={meta.icon} tone={meta.tone} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {doc.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {folderName(doc.folderId)} · hết hạn{" "}
                    {doc.expiresAt ? formatDay(doc.expiresAt) : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold",
                    expiryChipClass[expiry.level],
                  )}
                >
                  {expiry.label}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
