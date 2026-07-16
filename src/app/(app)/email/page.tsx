import type { Metadata } from "next";
import { PenSquare } from "lucide-react";
import { emails } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmailBrowser } from "@/components/email/email-browser";

export const metadata: Metadata = { title: "Email" };

/** Hộp thư 3 cột: thư mục, danh sách thư và nội dung thư đang chọn. */
export default function EmailPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Email"
        description="Đọc, lọc và lưu những email đáng nhớ vào Second Brain."
        action={
          <Button>
            <PenSquare size={17} />
            Soạn thư
          </Button>
        }
      />

      <EmailBrowser emails={emails} />
    </div>
  );
}
