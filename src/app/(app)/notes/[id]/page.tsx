import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, NotebookPen, Pin, RefreshCw } from "lucide-react";
import { notes } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { NoteBody } from "@/components/notes/note-body";

interface PageProps {
  /** Next.js 16: params là Promise, phải await trước khi dùng. */
  params: Promise<{ id: string }>;
}

/** Prerender sẵn mọi ghi chú — số lượng nhỏ và cố định. */
export function generateStaticParams() {
  return notes.map((note) => ({ id: note.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const note = notes.find((item) => item.id === id);
  return { title: note ? note.title : "Không tìm thấy ghi chú" };
}

/** "15/07/2026 lúc 10:15" */
function fullDate(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${day} lúc ${time}`;
}

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const note = notes.find((item) => item.id === id);

  if (!note) notFound();

  // Chỉ hiện dòng "cập nhật" khi thực sự khác lúc tạo.
  const wasEdited = note.updatedAt !== note.createdAt;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/notes"
        className="inline-flex items-center gap-1.5 rounded-lg py-1 text-[13px] font-medium text-ink-soft transition-colors hover:text-brand-700"
      >
        <ArrowLeft size={16} />
        Tất cả ghi chú
      </Link>

      <header className="mt-4 flex items-start gap-3.5">
        <IconTile icon={NotebookPen} tone={note.color} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5">
            <h1 className="min-w-0 flex-1 text-[26px] leading-snug font-semibold text-ink">
              {note.title}
            </h1>
            {note.pinned ? (
              <span className="mt-1.5 inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-brand-600">
                <Pin size={14} />
                Đã ghim
              </span>
            ) : null}
          </div>

          {note.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <Badge key={tag} tone={note.color}>
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <CalendarPlus size={13} />
              Tạo {fullDate(note.createdAt)}
            </span>
            {wasEdited ? (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw size={13} />
                Cập nhật {fullDate(note.updatedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <Card className="mt-6 p-6">
        <NoteBody body={note.body} />
      </Card>
    </div>
  );
}
