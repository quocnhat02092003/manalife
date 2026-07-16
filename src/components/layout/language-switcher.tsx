"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionary";

/**
 * Nút chuyển Việt ↔ Anh ở Topbar.
 *
 * Ghi cookie rồi router.refresh(): cookie là nguồn sự thật duy nhất nên cả
 * cây Server Component lẫn client render lại cùng một ngôn ngữ — không có
 * khoảnh khắc nửa Việt nửa Anh.
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [switching, setSwitching] = useState(false);

  function switchTo(next: Locale) {
    if (next === locale || switching) return;
    setSwitching(true);
    // Cookie 1 năm, path=/ để mọi trang (kể cả API nếu cần) cùng thấy.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
    // refresh() không unmount component — tự mở khoá sau khi cây mới về.
    setTimeout(() => setSwitching(false), 500);
  }

  const nextLocale: Locale = locale === "vi" ? "en" : "vi";

  return (
    <button
      type="button"
      onClick={() => switchTo(nextLocale)}
      aria-label={
        locale === "vi" ? t.shell.switchToEnglish : t.shell.switchToVietnamese
      }
      title={t.shell.language}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold text-ink-soft",
        "transition-colors hover:bg-brand-50 hover:text-brand-700",
        switching && "opacity-60",
      )}
    >
      <Languages size={16} aria-hidden />
      <span aria-hidden className="uppercase">
        {locale === "vi" ? "VI" : "EN"}
      </span>
    </button>
  );
}
