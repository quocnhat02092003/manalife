import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { documentFolders, personalDocuments } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ExpiringSoon } from "@/components/documents/expiring-soon";
import { DocumentsBrowser } from "@/components/documents/documents-browser";

export const metadata: Metadata = { title: "Tài liệu" };

/** Kho tài liệu cá nhân: nhắc gia hạn, lọc theo thư mục, tìm theo tên và tag. */
export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Tài liệu"
        description="Giấy tờ, hợp đồng và hoá đơn của bạn, luôn tìm lại được khi cần."
        action={
          <Button>
            <Upload size={17} />
            Tải lên
          </Button>
        }
      />

      <ExpiringSoon documents={personalDocuments} folders={documentFolders} />

      <DocumentsBrowser
        documents={personalDocuments}
        folders={documentFolders}
      />
    </div>
  );
}
