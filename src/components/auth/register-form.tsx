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
 * Form đăng ký — gọi POST /api/auth/register, tạo tài khoản và đăng nhập
 * luôn. Lỗi trùng email do server trả về đổ vào `errors.email` qua
 * `error.fields`.
 */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateRegister({ name, email, password, confirmPassword });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string; fields?: FieldErrors };
      } | null;
      if (body?.error?.fields) setErrors(body.error.fields);
      else setFormError(body?.error?.message ?? "Có lỗi xảy ra. Thử lại sau.");
    } catch {
      setFormError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[28px] font-semibold text-ink">Tạo tài khoản</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Bắt đầu sắp xếp lại cuộc sống của bạn. Miễn phí.
      </p>

      {formError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-[13px] text-danger"
        >
          {formError}
        </p>
      ) : null}

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
