"use client";

import { useMemo, useState } from "react";
import { Brain, Layers, Search, type LucideIcon } from "lucide-react";
import type { Capture, CaptureType } from "@/types";
import { captureTypeLabels } from "@/lib/mock/second-brain";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { captureMeta, captureTypeOrder } from "./capture-meta";
import { CaptureCard } from "./capture-card";

/** "all" là trạng thái không lọc theo loại. */
type TypeFilter = CaptureType | "all";

/** So khớp không phân biệt hoa thường và dấu tổ hợp Unicode. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

function FilterChip({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "border border-line-strong bg-surface text-ink-soft hover:bg-surface-muted",
      )}
    >
      <Icon size={14} aria-hidden />
      {label}
      <span className={cn("text-[12px]", active ? "text-brand-100" : "text-ink-faint")}>
        {count}
      </span>
    </button>
  );
}

function TagChip({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-7 shrink-0 rounded-lg px-2.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "bg-surface-muted text-ink-soft hover:bg-brand-50 hover:text-brand-700",
      )}
    >
      {tag}
    </button>
  );
}

/** Tìm kiếm, lọc theo loại và tag, rồi hiện lưới thẻ nội dung đã lưu. */
export function CapturesBrowser({ captures }: { captures: Capture[] }) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<TypeFilter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Đếm theo loại trên toàn bộ dữ liệu — số này không đổi khi lọc để người
  // dùng luôn biết mỗi loại thực sự có bao nhiêu mục.
  const countByType = useMemo(() => {
    const result = Object.fromEntries(
      captureTypeOrder.map((type) => [type, 0]),
    ) as Record<CaptureType, number>;
    for (const capture of captures) result[capture.type] += 1;
    return result;
  }, [captures]);

  // Tất cả tag duy nhất, sắp theo bảng chữ cái tiếng Việt.
  const allTags = useMemo(
    () =>
      [...new Set(captures.flatMap((capture) => capture.tags))].sort((a, b) =>
        a.localeCompare(b, "vi"),
      ),
    [captures],
  );

  const filtered = useMemo(() => {
    const keyword = normalize(query.trim());

    return captures
      .filter((capture) => {
        const matchesType = activeType === "all" || capture.type === activeType;
        const matchesTag = activeTag === null || capture.tags.includes(activeTag);
        const matchesQuery =
          keyword === "" ||
          normalize(capture.title).includes(keyword) ||
          normalize(capture.excerpt ?? "").includes(keyword) ||
          capture.tags.some((tag) => normalize(tag).includes(keyword));
        return matchesType && matchesTag && matchesQuery;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [captures, query, activeType, activeTag]);

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
          placeholder="Tìm theo tiêu đề, trích đoạn hoặc tag…"
          aria-label="Tìm nội dung đã lưu"
          className="pl-9"
        />
      </div>

      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          icon={Layers}
          label="Tất cả"
          count={captures.length}
          active={activeType === "all"}
          onClick={() => setActiveType("all")}
        />
        {captureTypeOrder.map((type) => (
          <FilterChip
            key={type}
            icon={captureMeta[type].icon}
            label={captureTypeLabels[type]}
            count={countByType[type]}
            active={activeType === type}
            onClick={() => setActiveType(activeType === type ? "all" : type)}
          />
        ))}
      </div>

      {allTags.length > 0 ? (
        <div className="scrollbar-none mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((capture) => (
            <CaptureCard key={capture.id} capture={capture} />
          ))}
        </div>
      ) : captures.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Brain}
          title="Chưa lưu nội dung nào"
          description="Lưu bài viết, video hay ghi chú đầu tiên để bắt đầu xây dựng đồ thị tri thức của bạn."
        />
      ) : (
        <EmptyState
          className="mt-5"
          icon={Brain}
          title="Không tìm thấy nội dung"
          description="Thử từ khoá khác, hoặc bỏ bớt bộ lọc loại và tag để xem thêm kết quả."
        />
      )}
    </div>
  );
}
