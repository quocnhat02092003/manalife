"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { navItems, navSections } from "@/config/nav";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n/client";

interface TopbarUser {
  name: string;
  avatarUrl: string | null;
}

/**
 * Thanh trên cùng: nút mở menu (mobile), ô tìm kiếm, chuông thông báo và
 * avatar của người đang đăng nhập (bấm vào mở Cài đặt).
 * Ô tìm kiếm hiện là giao diện — sẽ nối vào GET /api/search khi có API.
 */
export function Topbar({ user }: { user: TopbarUser }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  /** Nhãn điều hướng theo ngôn ngữ hiện tại; thiếu khoá thì giữ bản gốc. */
  const navLabel = (href: string, fallback: string) =>
    t.nav.items[href]?.label ?? fallback;

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
        <IconButton
          aria-label={t.shell.openMenu}
          className="lg:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={18} />
        </IconButton>

        <span className="text-sm font-semibold text-ink lg:hidden">
          {current ? navLabel(current.href, current.label) : "manalife"}
        </span>

        <div className="relative ml-auto hidden w-full max-w-sm lg:block">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            placeholder={t.shell.searchPlaceholder}
            aria-label={t.shell.searchAria}
            className="h-9 w-full rounded-lg border border-line bg-surface-muted pr-3 pl-9 text-[13px] text-ink transition-colors placeholder:text-ink-faint focus:border-brand-400 focus:bg-surface focus:outline-none"
          />
        </div>

        {/* Chuyển ngôn ngữ đứng cạnh chuông thông báo. */}
        <span className="ml-auto flex items-center gap-1 lg:ml-0">
          <LanguageSwitcher />
          <NotificationsBell />
        </span>

        <Link
          href="/settings"
          title={`${user.name} — ${t.shell.settings}`}
          aria-label={t.shell.accountAria}
          className="shrink-0 rounded-full transition-opacity hover:opacity-85"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        </Link>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={t.shell.closeMenu}
            className="absolute inset-0 bg-ink/25"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[20px] font-bold text-brand-700">
                manalife
              </span>
              <IconButton
                aria-label={t.shell.closeMenu}
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {navSections.map((section, i) => (
                <div key={section.title ?? i} className={cn(i > 0 && "mt-5")}>
                  {section.key ? (
                    <p className="px-2 pb-2 text-[11px] font-semibold text-ink-faint uppercase">
                      {t.nav.sections[section.key]}
                    </p>
                  ) : null}
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                              active
                                ? "bg-brand-50 font-semibold text-brand-700"
                                : "font-medium text-ink-soft hover:bg-surface-muted",
                            )}
                          >
                            <item.icon
                              size={17}
                              className={
                                active ? "text-brand-600" : "text-ink-faint"
                              }
                            />
                            {navLabel(item.href, item.label)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
