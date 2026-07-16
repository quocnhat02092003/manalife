"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { validateEmail } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/**
 * Form quên mật khẩu.
 *
 * TẦNG UI — chưa gửi email thật. Khi nối API: gọi `POST /api/auth/forgot-password`
 * (xem docs/api/auth.md). Lưu ý bảo mật: API luôn trả 200 dù email có tồn tại
 * hay không, và giao diện dưới đây đã bám theo nguyên tắc đó — thông báo thành
 * công không tiết lộ email nào đã đăng ký.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateEmail(email);
    setError(found);
    if (found) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 500);
  }

  if (sent) {
    return (
      <div>
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <MailCheck size={22} />
        </span>
        <h1 className="mt-4 text-[26px] font-semibold text-ink">
          Kiểm tra hộp thư của bạn
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Nếu <span className="font-medium text-ink">{email}</span> có tài khoản
          tại manalife, chúng tôi đã gửi một liên kết đặt lại mật khẩu. Liên kết
          có hiệu lực trong 30 phút.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 text-[13px] font-medium text-brand-700 hover:underline"
        >
          Dùng email khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-[28px] font-semibold text-ink">Quên mật khẩu</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
      </p>

      <div className="mt-8">
        <Field label="Email" htmlFor="email" error={error ?? undefined}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
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
            Đang gửi…
          </>
        ) : (
          "Gửi liên kết đặt lại"
        )}
      </Button>
    </form>
  );
}
