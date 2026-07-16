import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { notes } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { NotesBrowser } from "@/components/notes/notes-browser";

export const metadata: Metadata = { title: "Ghi chú" };

/** Danh sách ghi chú: tìm kiếm, lọc theo tag và lưới thẻ kiểu masonry. */
export default function NotesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Ghi chú"
        description="Mọi ý tưởng, trích dẫn và danh sách của bạn ở một nơi."
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
