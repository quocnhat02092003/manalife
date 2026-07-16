"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Files,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentFolder, PersonalDocument } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dot } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { DocumentCard, DocumentRow } from "./document-card";

/** Mục đang chờ xác nhận xoá — điều khiển AlertDialog dùng chung. */
type PendingDelete =
  | { type: "folder"; folder: DocumentFolder }
  | { type: "document"; doc: PersonalDocument };

type ViewMode = "grid" | "list";
/** null = xem tất cả thư mục. */
type FolderFilter = string | null;

/** So khớp không phân biệt hoa thường và dấu tổ hợp Unicode. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

/** Đọc thông báo lỗi từ envelope `{ error: { message } }` của API. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
    };
    return body.error?.message ?? "Có lỗi xảy ra. Thử lại sau.";
  } catch {
    return "Có lỗi xảy ra. Thử lại sau.";
  }
}

function FolderItem({
  active,
  count,
  onClick,
  onDelete,
  leading,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  /** Có mặt → hiện nút xoá khi hover/focus. "Tất cả" không xoá được. */
  onDelete?: () => void;
  leading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
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
            onDelete ? "group-focus-within:opacity-0 group-hover:opacity-0" : "",
          )}
        >
          {count}
        </span>
      </button>

      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Xoá thư mục"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-ink-faint opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
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

/**
 * Cột thư mục + lưới/danh sách tài liệu, có tìm kiếm theo tên và tag.
 *
 * Mọi thao tác ghi gọi /api/documents* rồi `router.refresh()` — trang là
 * Server Component đọc thẳng Prisma, refresh xong props tự mới. Không giữ
 * bản sao dữ liệu nào ở client để khỏi lệch hai nguồn sự thật.
 */
export function DocumentsBrowser({ documents, folders }: DocumentsBrowserProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [folderId, setFolderId] = useState<FolderFilter>(null);
  const [view, setView] = useState<ViewMode>("grid");

  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

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

  // -------------------------------------------------------------------------
  // Thao tác ghi
  // -------------------------------------------------------------------------

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    // Tải tuần tự để thông báo lỗi chỉ đích danh file hỏng; số file mỗi lần
    // chọn nhỏ nên không đáng tối ưu song song.
    let succeeded = 0;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set("file", file);
      if (folderId) form.set("folderId", folderId);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: form,
      });
      if (response.ok) {
        succeeded += 1;
      } else {
        toast.error(`${file.name}: ${await readErrorMessage(response)}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (succeeded > 0) {
      toast.success(
        succeeded === 1 ? "Đã tải lên 1 file." : `Đã tải lên ${succeeded} file.`,
      );
    }
    router.refresh();
  }

  async function handleCreateFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;

    const response = await fetch("/api/document-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      toast.error(await readErrorMessage(response));
      return;
    }

    setNewFolderName("");
    setCreatingFolder(false);
    toast.success(`Đã tạo thư mục "${name}".`);
    router.refresh();
  }

  /** Chạy sau khi người dùng bấm xác nhận trong AlertDialog. */
  async function confirmPendingDelete() {
    if (!pendingDelete) return;

    if (pendingDelete.type === "folder") {
      const { folder } = pendingDelete;
      const response = await fetch(`/api/document-folders/${folder.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }
      if (folderId === folder.id) setFolderId(null);
      toast.success(`Đã xoá thư mục "${folder.name}". Tài liệu bên trong vẫn còn.`);
    } else {
      const { doc } = pendingDelete;
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }
      toast.success(`Đã xoá "${doc.name}".`);
    }

    setPendingDelete(null);
    router.refresh();
  }

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
              onDelete={() => setPendingDelete({ type: "folder", folder })}
              leading={<Dot tone={folder.color} />}
            >
              {folder.name}
            </FolderItem>
          ))}
        </nav>

        {creatingFolder ? (
          <form onSubmit={handleCreateFolder} className="mt-2 px-1 pb-1">
            <Input
              autoFocus
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Tên thư mục…"
              aria-label="Tên thư mục mới"
              className="h-9 text-[13px]"
            />
            <div className="mt-1.5 flex gap-1.5">
              <Button type="submit" size="sm" className="flex-1">
                Tạo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setCreatingFolder(false);
                  setNewFolderName("");
                }}
              >
                Huỷ
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingFolder(true)}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-ink-faint transition-colors hover:bg-surface-muted hover:text-brand-700"
          >
            <FolderPlus size={14} aria-hidden />
            Thư mục mới
          </button>
        )}
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

          {/* Input file ẩn — nút bấm mở hộp thoại chọn file của trình duyệt. */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0"
          >
            {uploading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Đang tải…
              </>
            ) : (
              <>
                <Upload size={17} />
                Tải lên
              </>
            )}
          </Button>
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
                description="Tải lên hộ chiếu, hợp đồng, hình ảnh hay video để lưu trữ ở một nơi."
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
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={() => setPendingDelete({ type: "document", doc })}
              />
            ))}
          </div>
        ) : (
          <Card className="mt-3 divide-y divide-line">
            {filtered.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onDelete={() => setPendingDelete({ type: "document", doc })}
              />
            ))}
          </Card>
        )}
      </div>

      {/* Hộp thoại xác nhận xoá dùng chung cho thư mục và tài liệu. Xoá thư
          mục là thao tác an toàn (tài liệu còn nguyên); xoá tài liệu là vĩnh
          viễn — câu chữ phải nói rõ khác biệt đó. */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.type === "folder"
                ? `Xoá thư mục "${pendingDelete.folder.name}"?`
                : `Xoá vĩnh viễn "${pendingDelete?.doc.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.type === "folder"
                ? "Tài liệu bên trong vẫn còn nguyên, chỉ mất liên kết thư mục — bạn có thể xếp lại vào thư mục khác."
                : "Tài liệu và file trong kho lưu trữ sẽ bị xoá vĩnh viễn. Không hoàn tác được."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPendingDelete}
              className="bg-danger text-white hover:bg-danger/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
