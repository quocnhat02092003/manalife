"use client";

import { useMemo, useState } from "react";
import { Files, FolderOpen, LayoutGrid, List, Search } from "lucide-react";
import type { DocumentFolder, PersonalDocument } from "@/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dot } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentCard, DocumentRow } from "./document-card";

type ViewMode = "grid" | "list";
/** null = xem tất cả thư mục. */
type FolderFilter = string | null;

/** So khớp không phân biệt hoa thường và dấu tổ hợp Unicode. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

function FolderItem({
  active,
  count,
  onClick,
  leading,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  leading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-ink-soft hover:bg-surface-muted",
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {leading}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
        {children}
      </span>
      <span
        className={cn(
          "shrink-0 text-[11px]",
          active ? "text-brand-600" : "text-ink-faint",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const options: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", icon: LayoutGrid, label: "Xem dạng lưới" },
    { mode: "list", icon: List, label: "Xem dạng danh sách" },
  ];

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-line-strong bg-surface p-0.5">
      {options.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          aria-label={label}
          aria-pressed={view === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md transition-colors",
            view === mode
              ? "bg-brand-600 text-white"
              : "text-ink-soft hover:bg-surface-muted hover:text-brand-700",
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

interface DocumentsBrowserProps {
  documents: PersonalDocument[];
  folders: DocumentFolder[];
}

/** Cột thư mục + lưới/danh sách tài liệu, có tìm kiếm theo tên và tag. */
export function DocumentsBrowser({ documents, folders }: DocumentsBrowserProps) {
  const [query, setQuery] = useState("");
  const [folderId, setFolderId] = useState<FolderFilter>(null);
  const [view, setView] = useState<ViewMode>("grid");

  // Đếm thật số tài liệu trong từng thư mục.
  const countByFolder = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documents) {
      if (!doc.folderId) continue;
      counts.set(doc.folderId, (counts.get(doc.folderId) ?? 0) + 1);
    }
    return counts;
  }, [documents]);

  const filtered = useMemo(() => {
    const keyword = normalize(query.trim());

    return documents.filter((doc) => {
      const matchesFolder = folderId === null || doc.folderId === folderId;
      const matchesQuery =
        keyword === "" ||
        normalize(doc.name).includes(keyword) ||
        doc.tags.some((tag) => normalize(tag).includes(keyword));
      return matchesFolder && matchesQuery;
    });
  }, [documents, query, folderId]);

  const activeFolderName =
    folderId === null
      ? null
      : (folders.find((folder) => folder.id === folderId)?.name ?? null);

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* Cột trái: thư mục */}
      <Card className="p-2 lg:w-56 lg:shrink-0">
        <nav className="space-y-0.5">
          <FolderItem
            active={folderId === null}
            count={documents.length}
            onClick={() => setFolderId(null)}
            leading={<Files size={14} aria-hidden />}
          >
            Tất cả
          </FolderItem>

          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              active={folderId === folder.id}
              count={countByFolder.get(folder.id) ?? 0}
              onClick={() => setFolderId(folder.id)}
              leading={<Dot tone={folder.color} />}
            >
              {folder.name}
            </FolderItem>
          ))}
        </nav>
      </Card>

      {/* Khu chính */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc tag…"
              aria-label="Tìm tài liệu"
              className="pl-9"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        <p className="mt-3 text-[12px] text-ink-faint">
          {filtered.length} tài liệu
          {activeFolderName ? ` trong "${activeFolderName}"` : ""}
        </p>

        {filtered.length === 0 ? (
          <Card className="mt-3">
            {documents.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Chưa có tài liệu nào"
                description="Tải lên hộ chiếu, hợp đồng hay giấy tờ quan trọng để lưu trữ ở một nơi."
              />
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="Không tìm thấy tài liệu"
                description="Thử từ khoá khác hoặc chọn thư mục “Tất cả” để xem thêm kết quả."
              />
            )}
          </Card>
        ) : view === "grid" ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        ) : (
          <Card className="mt-3 divide-y divide-line">
            {filtered.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
