"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { currentUser } from "@/lib/mock";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * TẦNG UI — chưa xoá session thật. Khi nối API: gọi `POST /api/auth/logout`
 * (xem docs/api/auth.md) để server xoá cookie phiên, rồi mới điều hướng.
 */
export function LogoutPanel() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  function handleLogout() {
    setSubmitting(true);
    setTimeout(() => router.push("/login"), 400);
  }

  return (
    <div className="w-full max-w-sm rounded-card border border-line bg-surface p-7 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <LogOut size={20} />
      </span>

      <h1 className="mt-4 text-[22px] font-semibold text-ink">Đăng xuất?</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Bạn sẽ cần đăng nhập lại để quay lại không gian của mình.
      </p>

      <div className="mt-5 flex items-center justify-center gap-2.5 rounded-xl bg-surface-muted px-4 py-3">
        <Avatar name={currentUser.name} size="sm" />
        <div className="min-w-0 text-left">
          <p className="truncate text-[13px] font-semibold text-ink">
            {currentUser.name}
          </p>
          <p className="truncate text-[11px] text-ink-faint">
            {currentUser.email}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Ở lại
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleLogout}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Đang thoát…
            </>
          ) : (
            "Đăng xuất"
          )}
        </Button>
      </div>
    </div>
  );
}
