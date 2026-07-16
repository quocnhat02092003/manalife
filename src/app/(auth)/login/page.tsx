import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

/**
 * Thông báo lỗi OAuth — callback chuyển hướng về đây với ?error=<mã>.
 * Chỉ map mã đã biết sang câu chữ; giá trị lạ trên URL bị bỏ qua để không
 * thành chỗ cho người khác nhét nội dung tuỳ ý vào trang.
 */
const oauthErrors: Record<string, string> = {
  oauth_denied: "Bạn đã huỷ đăng nhập, hoặc phiên đăng nhập đã hết hạn. Thử lại nhé.",
  oauth_failed: "Đăng nhập không thành công. Vui lòng thử lại sau.",
  oauth_no_email:
    "Không lấy được email đã xác minh từ tài khoản này. Hãy xác minh email ở nhà cung cấp rồi thử lại.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <LoginForm oauthError={error ? oauthErrors[error] : undefined} />;
}
