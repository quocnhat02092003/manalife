import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { notes } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { NotesBrowser } from "@/components/notes/notes-browser";

export const metadata: Metadata = { title: "Ghi chú" };

/** Danh sách ghi chú: tìm kiếm, lọc theo tag và lưới thẻ kiểu masonry. */
export default async function NotesPage() {
  const t = await getDict();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.pages.notes.title}
        description={t.pages.notes.description}
        action={
          <Button>
            <Plus size={17} />
            Ghi chú mới
          </Button>
        }
      />

      <NotesBrowser notes={notes} />
    </div>
  );
}
