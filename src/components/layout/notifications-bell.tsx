"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/dictionary";
import { IconButton } from "@/components/ui/button";
import {
  clearAll,
  markAllRead,
  useNotifications,
  type AppNotification,
} from "@/lib/notifications";

/** "5 phút trước" / "5 minutes ago" — thời gian tương đối theo ngôn ngữ app. */
function timeAgo(iso: string, locale: Locale): string {
  return formatDistanceToNow(new Date(iso), {
    addSuffix: true,
    locale: locale === "vi" ? vi : enUS,
  });
}

function NotificationItem({
  notification,
  locale,
  onNavigate,
}: {
  notification: AppNotification;
  locale: Locale;
  onNavigate: () => void;
}) {
  const body = (
    <>
      {/* Chấm "chưa đọc" — mất khi đóng panel (markAllRead). */}
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          notification.read ? "bg-transparent" : "bg-clay",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-snug font-medium text-ink">
          {notification.title}
        </span>
        {notification.description ? (
          <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
            {notification.description}
          </span>
        ) : null}
        <span className="mt-0.5 block text-[11px] text-ink-faint">
          {timeAgo(notification.createdAt, locale)}
        </span>
      </span>
    </>
  );

  const itemClass =
    "flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted";

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={onNavigate} className={itemClass}>
        {body}
      </Link>
    );
  }
  return <div className={itemClass}>{body}</div>;
}

/**
 * Chuông thông báo ở Topbar: badge số chưa đọc + panel thả xuống.
 *
 * Đóng panel (bấm ngoài, Escape, hoặc điều hướng) thì đánh dấu tất cả đã
 * đọc — badge phản ánh "có gì mới từ lần xem trước", không phải việc tồn
 * đọng phải xử lý.
 */
export function NotificationsBell() {
  const notifications = useNotifications();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Đồng bộ với hệ thống ngoài (document): bấm ngoài panel hoặc Escape thì
  // đóng. Cleanup của effect cũng là lúc "vừa đóng" → đánh dấu đã đọc.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      markAllRead();
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        aria-label={
          unread > 0 ? t.notifications.unreadAria(unread) : t.notifications.aria
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative">
          <Bell size={18} />
          {unread > 0 ? (
            <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-clay px-1 text-[9px] leading-none font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
      </IconButton>

      {open ? (
        <div
          role="dialog"
          aria-label={t.notifications.aria}
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-semibold text-ink">
              {t.notifications.title}
            </h2>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-[12px] font-medium text-ink-faint transition-colors hover:text-danger"
              >
                {t.notifications.clearAll}
              </button>
            ) : null}
          </div>

          {notifications.length > 0 ? (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    locale={locale}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff size={20} className="text-ink-faint" aria-hidden />
              <p className="text-[13px] text-ink-faint">
                {t.notifications.empty}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
