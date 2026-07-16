"use client";

import { useMemo, useState } from "react";
import { MailOpen, MailQuestion, Search } from "lucide-react";
import type { EmailMessage, MailboxView } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderList, messagesInFolder } from "./folder-list";
import { MessageList } from "./message-list";
import { MessageView } from "./message-view";

/** So khớp không phân biệt hoa thường và dấu tổ hợp Unicode. */
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

export function EmailBrowser({ emails }: { emails: EmailMessage[] }) {
  const [messages, setMessages] = useState<EmailMessage[]>(emails);
  const [folder, setFolder] = useState<MailboxView>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Thư trong thư mục hiện tại, đã lọc theo từ khoá, mới nhất lên đầu.
  const visible = useMemo(() => {
    const keyword = normalize(query.trim());

    return messagesInFolder(messages, folder)
      .filter(
        (message) =>
          keyword === "" ||
          normalize(message.subject).includes(keyword) ||
          normalize(message.fromName).includes(keyword),
      )
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }, [messages, folder, query]);

  // Tìm trong danh sách đang hiện: thư bị lọc/chuyển đi thì bỏ chọn luôn.
  const selected = visible.find((message) => message.id === selectedId) ?? null;

  function patchMessage(id: string, patch: Partial<EmailMessage>) {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    );
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    patchMessage(id, { read: true }); // Mở thư là đã đọc.
  }

  function handleFolder(next: MailboxView) {
    setFolder(next);
    setSelectedId(null);
  }

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-13.5rem)] lg:grid-cols-[210px_330px_1fr]">
      {/* Cột trái — thư mục */}
      <Card className="lg:overflow-y-auto">
        <FolderList
          messages={messages}
          active={folder}
          onSelect={handleFolder}
        />
      </Card>

      {/* Cột giữa — danh sách thư */}
      <Card className="flex min-h-0 flex-col">
        <div className="relative shrink-0 p-3">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-6 -translate-y-1/2 text-ink-faint"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tiêu đề hoặc người gửi…"
            aria-label="Tìm thư"
            className="h-9 pl-9 text-[13px]"
          />
        </div>

        <div className="max-h-[26rem] min-h-0 flex-1 overflow-y-auto border-t border-line lg:max-h-none">
          {visible.length > 0 ? (
            <MessageList
              messages={visible}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          ) : (
            <EmptyState
              icon={MailQuestion}
              title="Không có thư nào"
              description={
                query.trim()
                  ? "Thử từ khoá khác hoặc chuyển sang thư mục khác."
                  : "Thư mục này đang trống."
              }
            />
          )}
        </div>
      </Card>

      {/* Cột phải — nội dung thư */}
      <Card className="flex min-h-0 flex-col">
        {selected ? (
          <MessageView
            message={selected}
            onToggleStar={() =>
              patchMessage(selected.id, { starred: !selected.starred })
            }
            onArchive={() => patchMessage(selected.id, { folder: "archive" })}
            onDelete={() => patchMessage(selected.id, { folder: "trash" })}
          />
        ) : (
          <EmptyState
            className="m-auto"
            icon={MailOpen}
            title="Chưa chọn thư nào"
            description="Chọn một thư trong danh sách để đọc nội dung và lưu vào Second Brain."
          />
        )}
      </Card>
    </div>
  );
}
