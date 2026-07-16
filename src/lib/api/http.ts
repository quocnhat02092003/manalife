import { NextResponse } from "next/server";

/**
 * Bọc response theo quy ước docs/api/README.md: thành công nằm trong `data`,
 * lỗi nằm trong `error` với `code` thuộc bảng mã chung. Mọi route handler
 * đều đi qua hai hàm này để không nơi nào trả shape lệch chuẩn.
 */

export function ok<T>(data: T, init?: { status?: number; meta?: unknown }) {
  const body = init?.meta === undefined ? { data } : { data, meta: init.meta };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function fail(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    { error: fields ? { code, message, fields } : { code, message } },
    { status },
  );
}

export const unauthenticated = () =>
  fail(401, "UNAUTHENTICATED", "Bạn cần đăng nhập để thực hiện thao tác này.");

export const notFound = () =>
  fail(404, "NOT_FOUND", "Không tìm thấy tài nguyên.");

export const malformedJson = () =>
  fail(400, "MALFORMED_JSON", "Body không phải JSON hợp lệ.");

/** Đọc JSON body; trả `null` khi body không parse được (→ MALFORMED_JSON). */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
