/**
 * Kiểm tra dữ liệu form.
 *
 * Các hàm này chạy ở client để phản hồi tức thì. Khi nối API, **server phải
 * kiểm tra lại y hệt** — validation phía client chỉ là trải nghiệm, không phải
 * lớp bảo mật. Xem docs/api/auth.md, mục "Validation".
 */

export interface FieldErrors {
  [field: string]: string;
}

/** Đủ chặt cho form, phần xác thực thật do server và email xác nhận đảm nhiệm. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Vui lòng nhập email.";
  if (!EMAIL_PATTERN.test(value)) return "Email không hợp lệ.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Vui lòng nhập mật khẩu.";
  if (password.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
  return null;
}

export function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Vui lòng nhập tên của bạn.";
  if (value.length < 2) return "Tên quá ngắn.";
  return null;
}

export function validateLogin(input: {
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  // Khi đăng nhập chỉ cần biết có nhập hay chưa — không áp quy tắc độ dài,
  // vì mật khẩu cũ có thể được tạo dưới quy tắc khác.
  if (!input.password) errors.password = "Vui lòng nhập mật khẩu.";
  return errors;
}

export function validateRegister(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  const name = validateName(input.name);
  if (name) errors.name = name;

  const email = validateEmail(input.email);
  if (email) errors.email = email;

  const password = validatePassword(input.password);
  if (password) errors.password = password;

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Mật khẩu nhập lại không khớp.";
  }

  return errors;
}

/** Điểm mạnh mật khẩu 0–4, dùng cho thanh gợi ý khi đăng ký. */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) || /[^\w\s]/.test(password)) score++;
  return Math.min(4, score);
}
