"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  passwordStrength,
  validateRegister,
  type FieldErrors,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];

/**
 * Form đăng ký.
 *
 * TẦNG UI — chưa tạo tài khoản thật. Khi nối API: thay `setTimeout` bằng
 * `POST /api/auth/register` (xem docs/api/auth.md). Lỗi trùng email do server
 * trả về sẽ đổ vào `errors.email` qua `error.fields`.
 */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateRegister({ name, email, password, confirmPassword });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setTimeout(() => router.push("/dashboard"), 500);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[28px] font-semibold text-ink">Tạo tài khoản</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Bắt đầu sắp xếp lại cuộc sống của bạn. Miễn phí.
      </p>

      <div className="mt-8 space-y-4">
        <Field label="Tên của bạn" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

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

        <Field
          label="Mật khẩu"
          htmlFor="password"
          error={errors.password}
          hint={!password ? "Ít nhất 8 ký tự." : undefined}
        >
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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

        {password ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i < strength ? "bg-brand-500" : "bg-line",
                  )}
                />
              ))}
            </div>
            <span className="shrink-0 text-[12px] text-ink-soft">
              {strengthLabels[strength]}
            </span>
          </div>
        ) : null}

        <Field
          label="Nhập lại mật khẩu"
          htmlFor="confirmPassword"
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
        </Field>
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
            Đang tạo tài khoản…
          </>
        ) : (
          "Tạo tài khoản"
        )}
      </Button>

      <div className="mt-6">
        <OAuthButtons />
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-soft">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
