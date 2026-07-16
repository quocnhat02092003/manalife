import { fileTypeFromBuffer } from "file-type";
import type { DocumentFolder, DocumentKind, PersonalDocument } from "@/types";

/**
 * Tầng chuyển đổi giữa Prisma và API cho module Tài liệu — đúng quy ước
 * docs/api/documents.md: `tags` là mảng ở API, chuỗi JSON ở database, và chỗ
 * parse/serialize nằm ở đây, ngay sát Prisma. MỌI route handler đi qua các
 * hàm này; không handler nào tự JSON.parse.
 */

// ---------------------------------------------------------------------------
// tags: chuỗi JSON ↔ mảng
// ---------------------------------------------------------------------------

/**
 * Chuỗi JSON trong cột `tags` → mảng chuỗi. Cột là String nên database không
 * đảm bảo nội dung là JSON hợp lệ — hỏng thì fallback []: một tài liệu mất
 * tag còn hơn cả trang trả 500.
 */
export function parseTags(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === "string");
  } catch {
    return [];
  }
}

/**
 * Kiểm tra và chuẩn hoá mảng tag từ client: mỗi tag 1–50 ký tự sau trim, bỏ
 * rỗng, khử trùng lặp. Trả null khi input không phải mảng chuỗi hợp lệ.
 */
export function sanitizeTags(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const tags: string[] = [];
  for (const item of input) {
    if (typeof item !== "string") return null;
    const tag = item.trim();
    if (tag.length === 0) continue;
    if (tag.length > 50) return null;
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

// ---------------------------------------------------------------------------
// Row → shape API (khớp src/types/index.ts)
// ---------------------------------------------------------------------------

/** Các cột được phép ra ngoài. KHÔNG có storageKey, mimeType, updatedAt. */
export const documentSelect = {
  id: true,
  name: true,
  kind: true,
  size: true,
  folderId: true,
  tags: true,
  expiresAt: true,
  createdAt: true,
} as const;

interface DocumentRow {
  id: string;
  name: string;
  kind: string;
  size: number;
  folderId: string | null;
  tags: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export function toDocument(row: DocumentRow): PersonalDocument {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as DocumentKind,
    size: row.size,
    folderId: row.folderId,
    tags: parseTags(row.tags),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFolder(row: {
  id: string;
  name: string;
  color: string;
}): DocumentFolder {
  return {
    id: row.id,
    name: row.name,
    color: row.color as DocumentFolder["color"],
  };
}

// ---------------------------------------------------------------------------
// MIME: danh sách trắng + suy ra kind
// ---------------------------------------------------------------------------

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  "pdf",
  "image",
  "video",
  "sheet",
  "doc",
  "other",
];

/**
 * Danh sách TRẮNG MIME → kind. Mọi MIME ngoài bảng đều bị từ chối — danh
 * sách đen luôn thiếu một thứ gì đó. Không có image/svg+xml là chủ ý: SVG là
 * XML chạy được script.
 */
const MIME_TO_KIND: Record<string, DocumentKind> = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/heic": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "sheet",
  "application/vnd.ms-excel": "sheet",
  "text/csv": "sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "doc",
  "application/msword": "doc",
  "text/plain": "doc",
  "text/markdown": "doc",
};

/**
 * Suy ra (kind, mime) từ NỘI DUNG file — đọc magic bytes, không tin đuôi tên
 * file hay Content-Type client khai. Trả null khi file không thuộc danh sách
 * trắng.
 *
 * Nhóm text (csv/plain/markdown) không có magic bytes nên `file-type` không
 * nhận ra. Với nhóm này: nội dung phải là UTF-8 hợp lệ, còn phân loại
 * sheet/doc dựa vào đuôi tên file — ở đây đuôi file chỉ quyết định NHÃN hiển
 * thị giữa hai loại văn bản vô hại, không quyết định file có được nhận hay
 * không.
 */
export async function detectFileKind(
  head: Buffer,
  fileName: string,
): Promise<{ kind: DocumentKind; mime: string; ext: string } | null> {
  const detected = await fileTypeFromBuffer(head);

  if (detected) {
    const kind = MIME_TO_KIND[detected.mime];
    return kind ? { kind, mime: detected.mime, ext: detected.ext } : null;
  }

  // Không có chữ ký nhận dạng được → chỉ còn cửa cho văn bản UTF-8 hợp lệ.
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(head);
  } catch {
    return null;
  }

  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (ext === "csv") return { kind: "sheet", mime: "text/csv", ext: "csv" };
  if (ext === "md") return { kind: "doc", mime: "text/markdown", ext: "md" };
  return { kind: "doc", mime: "text/plain", ext: "txt" };
}
