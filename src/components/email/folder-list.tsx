import { Archive, Inbox, Send, Star, Trash2, type LucideIcon } from "lucide-react";
import type { EmailMessage, MailboxView } from "@/types";
import { cn } from "@/lib/utils";

interface FolderMeta {
  /** MailboxView chứ không phải MailFolder: "starred" là bộ lọc, không phải
   *  thư mục thật. Xem chú thích của hai type trong src/types. */
  key: MailboxView;
  label: string;
  icon: LucideIcon;
}

/** Thứ tự hiển thị của các thư mục ở cột trái. */
export const folders: FolderMeta[] = [
  { key: "inbox", label: "Hộp thư đến", icon: Inbox },
  { key: "starred", label: "Có gắn sao", icon: Star },
  { key: "sent", label: "Đã gửi", icon: Send },
  { key: "archive", label: "Lưu trữ", icon: Archive },
  { key: "trash", label: "Thùng rác", icon: Trash2 },
];

/**
 * Lọc thư theo thư mục.
 *
 * Lưu ý: "Có gắn sao" không phải một giá trị của `folder` mà là bộ lọc xuyên
 * thư mục — thư nào được gắn sao cũng hiện ở đây, trừ thư đã xoá.
 */
export function messagesInFolder(
  messages: EmailMessage[],
  view: MailboxView,
): EmailMessage[] {
  if (view === "starred") {
    return messages.filter((item) => item.starred && item.folder !== "trash");
  }
  return messages.filter((item) => item.folder === view);
}

/** Số thư chưa đọc của một thư mục — tính từ dữ liệu thật, không hard-code. */
function unreadCount(messages: EmailMessage[], view: MailboxView): number {
  return messagesInFolder(messages, view).filter((item) => !item.read).length;
}

interface FolderListProps {
  messages: EmailMessage[];
  active: MailboxView;
  onSelect: (view: MailboxView) => void;
}

export function FolderList({ messages, active, onSelect }: FolderListProps) {
  return (
    <nav aria-label="Thư mục" className="p-2">
      <ul className="space-y-0.5">
        {folders.map(({ key, label, icon: Icon }) => {
          const unread = unreadCount(messages, key);
          const isActive = key === active;

          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "font-medium text-ink-soft hover:bg-surface-muted hover:text-ink",
                )}
              >
                <Icon size={16} aria-hidden className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {unread > 0 ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                      isActive
                        ? "bg-brand-600 text-white"
                        : "bg-surface-muted text-ink-soft",
                    )}
                  >
                    {unread}
                    <span className="sr-only"> thư chưa đọc</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
