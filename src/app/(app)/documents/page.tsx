import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  documentSelect,
  toDocument,
  toFolder,
} from "@/lib/api/documents";
import { getDict } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ExpiringSoon } from "@/components/documents/expiring-soon";
import { DocumentsBrowser } from "@/components/documents/documents-browser";

export const metadata: Metadata = { title: "Tài liệu" };

/**
 * Kho tài liệu cá nhân: nhắc gia hạn, lọc theo thư mục, tìm theo tên và tag.
 *
 * Trang đầu tiên chạy trên dữ liệu thật thay vì mock: đọc thẳng Prisma trong
 * Server Component (không cần qua HTTP với chính mình), còn các thao tác
 * ghi (upload, tạo/xoá thư mục, xoá tài liệu) đi qua /api/documents* từ
 * client rồi router.refresh() để server render lại với dữ liệu mới.
 */
export default async function DocumentsPage() {
  const session = await getSession();
  // Chặn ở tầng trang — dữ liệu thật thì không có "xem thử khi chưa đăng nhập".
  if (!session) redirect("/login");

  const [folderRows, documentRows] = await Promise.all([
    prisma.documentFolder.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.personalDocument.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: documentSelect,
    }),
  ]);

  const folders = folderRows.map(toFolder);
  const documents = documentRows.map(toDocument);
  const t = await getDict();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.pages.documents.title}
        description={t.pages.documents.description}
      />

      <ExpiringSoon documents={documents} folders={folders} />

      <DocumentsBrowser documents={documents} folders={folders} />
    </div>
  );
}
