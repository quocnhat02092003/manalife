import { randomBytes, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok, unauthenticated } from "@/lib/api/http";
import { requireSession } from "@/lib/api/require-session";
import {
  DOCUMENT_KINDS,
  detectFileKind,
  documentSelect,
  sanitizeTags,
  toDocument,
} from "@/lib/api/documents";
import { saveFile } from "@/lib/storage";

/** Giới hạn upload 25 MB (docs/api/documents.md). */
const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Nới thêm cho phần bao multipart khi kiểm tra Content-Length. */
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 1024 * 1024;

const SORTABLE = ["createdAt", "name", "size", "expiresAt"] as const;
type SortField = (typeof SORTABLE)[number];

/**
 * GET /api/documents — danh sách tài liệu của người đang đăng nhập, lọc theo
 * thư mục / loại / tag / từ khoá, có phân trang.
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  const params = request.nextUrl.searchParams;
  const fields: Record<string, string> = {};

  const kind = params.get("kind");
  if (kind !== null && !DOCUMENT_KINDS.includes(kind as never)) {
    fields.kind = "Loại tài liệu không hợp lệ.";
  }

  const rawSort = params.get("sort") ?? "-createdAt";
  const desc = rawSort.startsWith("-");
  const sortField = (desc ? rawSort.slice(1) : rawSort) as SortField;
  if (!SORTABLE.includes(sortField)) {
    fields.sort = "Trường sắp xếp không được hỗ trợ.";
  }

  const page = parseIntParam(params.get("page"), 1);
  const perPage = parseIntParam(params.get("perPage"), 20);
  if (page === null) fields.page = "page phải là số nguyên dương.";
  if (perPage === null) fields.perPage = "perPage phải là số nguyên dương.";

  if (Object.keys(fields).length > 0) {
    return fail(400, "VALIDATION_FAILED", "Tham số không hợp lệ.", fields);
  }

  // `folderId=none` là token tường minh cho "chưa xếp thư mục" (folderId IS
  // NULL) — query string không diễn đạt được null.
  const folderId = params.get("folderId");
  const tag = params.get("tag");
  const q = params.get("q");

  const rows = await prisma.personalDocument.findMany({
    where: {
      userId: session.userId,
      ...(folderId === null
        ? {}
        : { folderId: folderId === "none" ? null : folderId }),
      ...(kind ? { kind } : {}),
      ...(q ? { name: { contains: q } } : {}),
      // LIKE chỉ để thu hẹp sơ bộ — khớp chính xác làm trong bộ nhớ bên dưới,
      // vì `tags LIKE '%giấy tờ%'` sẽ khớp nhầm cả "giấy tờ xe".
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    orderBy: { [sortField]: desc ? "desc" : "asc" },
    select: documentSelect,
  });

  let documents = rows.map(toDocument);
  if (tag) documents = documents.filter((doc) => doc.tags.includes(tag));

  // Phân trang SAU khi lọc tag, nếu không meta.total sẽ sai.
  const total = documents.length;
  const start = (page! - 1) * perPage!;
  const data = documents.slice(start, start + perPage!);

  return ok(data, {
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage!)),
    },
  });
}

function parseIntParam(raw: string | null, fallback: number): number | null {
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

/**
 * POST /api/documents — tải file lên. Ngoại lệ duy nhất của quy ước JSON:
 * request là multipart/form-data (file nhị phân không đi qua JSON được).
 *
 * Các trường server tự quyết (id, userId, size, kind, storageKey, createdAt)
 * — client gửi lên cũng bị bỏ qua. `size` đếm byte thật, `kind` suy từ magic
 * bytes thật; đuôi file và Content-Type do client khai đều sửa được.
 */
export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthenticated();

  // Chốt chặn 1: Content-Length — từ chối sớm trước khi đọc byte nào.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    return fail(413, "PAYLOAD_TOO_LARGE", "File vượt giới hạn 25 MB.");
  }

  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return fail(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Endpoint này nhận multipart/form-data.",
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", {
      file: "Thiếu phần file.",
    });
  }

  // Chốt chặn 2: đếm byte thật của file đã nhận — Content-Length do client
  // khai, không tin được.
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_FILE_BYTES) {
    return fail(413, "PAYLOAD_TOO_LARGE", "File vượt giới hạn 25 MB.");
  }
  if (bytes.byteLength === 0) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", {
      file: "File rỗng.",
    });
  }

  // 4100 byte đầu là đủ cho magic bytes — không cần cả file.
  const detected = await detectFileKind(bytes.subarray(0, 4100), file.name);
  if (!detected) {
    return fail(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Định dạng file không được hỗ trợ.",
    );
  }

  const name = (String(form.get("name") ?? "") || file.name).trim();
  if (name.length < 1 || name.length > 200) {
    return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", {
      name: "Tên hiển thị phải dài 1–200 ký tự.",
    });
  }

  const rawTags = form.get("tags");
  let tags: string[] = [];
  if (typeof rawTags === "string" && rawTags !== "") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawTags);
    } catch {
      parsed = undefined;
    }
    const sanitized = sanitizeTags(parsed);
    if (sanitized === null) {
      return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", {
        tags: "tags phải là chuỗi JSON của mảng chuỗi, mỗi tag 1–50 ký tự.",
      });
    }
    tags = sanitized;
  }

  const rawExpiresAt = form.get("expiresAt");
  let expiresAt: Date | null = null;
  if (typeof rawExpiresAt === "string" && rawExpiresAt !== "") {
    expiresAt = new Date(rawExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return fail(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ.", {
        expiresAt: "Ngày hết hạn phải theo định dạng ISO 8601.",
      });
    }
  }

  // Thư mục đích phải là của chính mình — Prisma chỉ kiểm tra khoá ngoại tồn
  // tại, không kiểm tra nó thuộc về ai.
  const rawFolderId = form.get("folderId");
  let folderId: string | null = null;
  if (typeof rawFolderId === "string" && rawFolderId !== "") {
    const folder = await prisma.documentFolder.findFirst({
      where: { id: rawFolderId, userId: session.userId },
      select: { id: true },
    });
    if (!folder) return fail(404, "NOT_FOUND", "Thư mục không tồn tại.");
    folderId = folder.id;
  }

  // Key do server sinh — không bao giờ nhét tên file client vào key.
  const documentId = randomUUID();
  const storageKey = `documents/${session.userId}/${documentId}/${randomBytes(8).toString("hex")}.${detected.ext}`;

  // Ghi file TRƯỚC, tạo dòng database SAU: nếu ghi file hỏng thì database
  // sạch; file mồ côi (DB fail sau khi ghi) là rác vô hại, dọn được.
  try {
    await saveFile(storageKey, bytes);
  } catch (error) {
    console.error("[documents] ghi file thất bại:", error);
    return fail(500, "INTERNAL_ERROR", "Không lưu được file. Thử lại sau.");
  }

  const row = await prisma.personalDocument.create({
    data: {
      id: documentId,
      userId: session.userId,
      name,
      kind: detected.kind,
      mimeType: detected.mime,
      size: bytes.byteLength,
      folderId,
      tags: JSON.stringify(tags),
      expiresAt,
      storageKey,
    },
    select: documentSelect,
  });

  return ok(toDocument(row), { status: 201 });
}
