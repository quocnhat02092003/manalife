"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { validateLogin, type FieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

/**
 * Form đăng nhập.
 *
 * TẦNG UI — chưa xác thực thật. Khi nối API: thay khối `setTimeout` bằng
 * `POST /api/auth/login` (xem docs/api/auth.md), đọc lỗi từ `error.fields`
 * để đổ vào `errors`, và bỏ hẳn phần điều hướng lạc quan ở dưới.
 */
export function LoginForm({ oauthError }: { oauthError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    // Giả lập độ trễ mạng để thấy được trạng thái đang gửi.
    setTimeout(() => router.push("/dashboard"), 500);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[28px] font-semibold text-ink">Chào mừng trở lại</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Đăng nhập để tiếp tục với không gian của bạn.
      </p>

      {oauthError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-[13px] text-danger"
        >
          {oauthError}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="Mật khẩu" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink-soft"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-[13px] font-medium text-brand-700 hover:underline"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="mt-6 w-full"
      >
        {submitting ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Đang đăng nhập…
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>

      <div className="mt-6">
        <OAuthButtons />
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-soft">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Tạo tài khoản
        </Link>
      </p>
    </form>
  );
}
