"use client";

import { useMemo, useState } from "react";
import { NotebookPen, Search } from "lucide-react";
import type { Note } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "./note-card";

/** Ghim lên đầu, trong mỗi nhóm thì mới cập nhật gần nhất đứng trước. */
function byPinnedThenRecent(a: Note, b: Note): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** So khớp không phân biệt hoa thường và dấu tổ hợp Unicode. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8 shrink-0 rounded-lg px-3 text-[13px] font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "border border-line-strong bg-surface text-ink-soft hover:bg-surface-muted",
      )}
    >
      {children}
    </button>
  );
}

export function NotesBrowser({ notes }: { notes: Note[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Tất cả tag duy nhất, sắp theo bảng chữ cái tiếng Việt.
  const allTags = useMemo(
    () =>
      [...new Set(notes.flatMap((note) => note.tags))].sort((a, b) =>
        a.localeCompare(b, "vi"),
      ),
    [notes],
  );

  const filtered = useMemo(() => {
    const keyword = normalize(query.trim());

    return notes
      .filter((note) => {
        const matchesTag = activeTag === null || note.tags.includes(activeTag);
        const matchesQuery =
          keyword === "" ||
          normalize(note.title).includes(keyword) ||
          normalize(note.body).includes(keyword);
        return matchesTag && matchesQuery;
      })
      .sort(byPinnedThenRecent);
  }, [notes, query, activeTag]);

  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tiêu đề hoặc nội dung…"
          aria-label="Tìm ghi chú"
          className="pl-9"
        />
      </div>

      {allTags.length > 0 ? (
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
          <TagChip active={activeTag === null} onClick={() => setActiveTag(null)}>
            Tất cả
          </TagChip>
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </TagChip>
          ))}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="mt-5 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={NotebookPen}
          title="Chưa có ghi chú nào"
          description="Tạo ghi chú đầu tiên để lưu lại ý tưởng, trích dẫn hay việc cần nhớ."
        />
      ) : (
        <EmptyState
          className="mt-5"
          icon={NotebookPen}
          title="Không tìm thấy ghi chú"
          description="Thử từ khoá khác hoặc bỏ bớt bộ lọc tag để xem thêm kết quả."
        />
      )}
    </div>
  );
}
