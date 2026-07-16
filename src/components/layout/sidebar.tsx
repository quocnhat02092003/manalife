"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { navSections } from "@/config/nav";
import { currentUser } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

/**
 * Điều hướng chính bên trái. Ẩn dưới lg, thay bằng MobileNav.
 * Trạng thái active so khớp theo tiền tố để route con (ví dụ /notes/abc)
 * vẫn làm sáng mục "Ghi chú".
 */
export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-line bg-surface",
        className,
      )}
    >
      <div className="px-5 py-5">
        <Link href="/dashboard" className="inline-flex items-baseline gap-0.5">
          <span className="text-[22px] font-bold text-brand-700">manalife</span>
          <span className="size-1.5 rounded-full bg-clay" aria-hidden />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section, i) => (
          <div key={section.title ?? i} className={cn(i > 0 && "mt-6")}>
            {section.title ? (
              <p className="px-2 pb-2 text-[11px] font-semibold text-ink-faint uppercase">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-50 font-semibold text-brand-700"
                          : "font-medium text-ink-soft hover:bg-surface-muted hover:text-ink",
                      )}
                    >
                      <item.icon
                        size={17}
                        strokeWidth={active ? 2.4 : 2}
                        className={active ? "text-brand-600" : "text-ink-faint"}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar name={currentUser.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">
              {currentUser.name}
            </p>
            <p className="truncate text-[11px] text-ink-faint">
              {currentUser.email}
            </p>
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <Link
            href="/settings"
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <Settings size={15} className="text-ink-faint" />
            Cài đặt
          </Link>
          <Link
            href="/logout"
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <LogOut size={15} className="text-ink-faint" />
            Thoát
          </Link>
        </div>
      </div>
    </aside>
  );
}
