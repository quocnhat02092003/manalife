import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-brand-700"
      >
        <ArrowLeft size={15} />
        Quay lại đăng nhập
      </Link>
      <ForgotPasswordForm />
    </>
  );
}
