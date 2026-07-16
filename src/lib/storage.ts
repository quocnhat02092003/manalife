import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

/**
 * Kho lưu trữ file trên đĩa cục bộ — đủ cho môi trường dev. Khi triển khai
 * thật, thay phần ruột các hàm này bằng S3/R2; chữ ký hàm giữ nguyên vì
 * `storageKey` đã là khoá trừu tượng, không phải đường dẫn tuyệt đối.
 *
 * Database chỉ giữ metadata; byte của file nằm ở đây, dưới `storage/`
 * (đã gitignore). Key do server sinh theo quy ước trong docs/api/documents.md:
 *
 *   documents/<userId>/<documentId>/<random>.<ext>
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage");

/**
 * Đổi key thành đường dẫn tuyệt đối, chặn path traversal. Key do server sinh
 * nên bình thường không thể chứa `..` — nhưng một dòng database bị sửa tay
 * không được phép biến thành quyền đọc file tuỳ ý trên máy chủ.
 */
function resolveKey(key: string): string {
  const full = path.resolve(STORAGE_ROOT, key);
  if (!full.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error(`storageKey không hợp lệ: ${key}`);
  }
  return full;
}

export async function saveFile(key: string, data: Buffer): Promise<void> {
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
}

/**
 * Xoá file. Nuốt lỗi có chủ ý: khi xoá tài liệu, dòng database đã xoá trước
 * (xem docs/api/documents.md) — file mồ côi là rác vô hại, còn ném lỗi ở đây
 * sẽ biến "xoá thành công" thành 500 vô nghĩa với người dùng.
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    await rm(resolveKey(key));
  } catch (error) {
    console.error(`[storage] không xoá được file ${key}:`, error);
  }
}

/** Mở stream đọc file cho endpoint tải về. Trả null khi file không tồn tại. */
export async function openFileStream(
  key: string,
): Promise<{ stream: ReadableStream; size: number } | null> {
  const full = resolveKey(key);
  try {
    const info = await stat(full);
    return {
      stream: Readable.toWeb(createReadStream(full)) as ReadableStream,
      size: info.size,
    };
  } catch {
    return null;
  }
}
