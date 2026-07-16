import bcrypt from "bcrypt";
import argon2 from "argon2";

/**
 * Băm mật khẩu bằng bcrypt, cost 12 (docs/api/auth.md cho phép bcrypt với
 * cost ≥ 12 khi không dùng argon2id). Tuyệt đối không dùng MD5/SHA-* trần —
 * hàm băm mật khẩu phải cố tình chậm.
 *
 * Lưu ý bcrypt chỉ dùng 72 byte đầu của mật khẩu — với độ dài mật khẩu
 * người thật thì không thành vấn đề, nhưng biết để không ngạc nhiên.
 */
const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Hash mồi cho so sánh giả: khi email không tồn tại (hoặc tài khoản chỉ có
 * OAuth, passwordHash = null) vẫn phải chạy MỘT phép verify trước khi trả
 * 401. Nếu không, request với email không tồn tại trả về nhanh hơn rõ rệt và
 * chênh lệch thời gian đó đủ để dò email nào đã đăng ký.
 *
 * Giá trị là bcrypt (cost 12) của một chuỗi ngẫu nhiên đã vứt đi — không ai
 * biết plaintext nên verify luôn thất bại, đúng như cần.
 */
const DUMMY_HASH =
  "$2b$12$fH082yOfsPabc7Tk9vDI0O7AKXrdEUQEVZ6uYiMox7xod4cfBnZiy";

/**
 * So mật khẩu với hash; `hash` null → so với hash mồi, luôn sai.
 *
 * Hash cũ dạng argon2id (giai đoạn trước khi chuyển sang bcrypt) vẫn verify
 * được — đổi thuật toán băm không được phép khoá tài khoản đã đăng ký. Người
 * dùng cũ sẽ được nâng dần sang bcrypt khi đổi mật khẩu.
 */
export async function verifyPassword(
  hash: string | null,
  password: string,
): Promise<boolean> {
  try {
    const stored = hash ?? DUMMY_HASH;
    const matched = stored.startsWith("$argon2")
      ? await argon2.verify(stored, password)
      : await bcrypt.compare(password, stored);
    return hash !== null && matched;
  } catch {
    return false;
  }
}
