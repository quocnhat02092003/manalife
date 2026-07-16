"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface LogoutPanelProps {
  user: { name: string; email: string; avatarUrl: string | null };
}

/**
 * Màn xác nhận đăng xuất. Nút "Đăng xuất" gọi POST /api/auth/logout để server
 * xoá phiên khỏi database và xoá cookie, rồi mới điều hướng về /login.
 * `router.refresh()` để cây Server Component quên sạch dữ liệu của phiên cũ.
 */
export function LogoutPanel({ user }: LogoutPanelProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleLogout() {
    setSubmitting(true);
    setError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error(`logout trả về ${response.status}`);
      router.push("/login");
      router.refresh();
    } catch {
      setSubmitting(false);
      setError(true);
    }
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
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <div className="min-w-0 text-left">
          <p className="truncate text-[13px] font-semibold text-ink">
            {user.name}
          </p>
          <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          Không đăng xuất được. Thử lại nhé.
        </p>
      ) : null}

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
