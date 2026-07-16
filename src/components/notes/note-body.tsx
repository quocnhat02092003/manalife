import type { ReactNode } from "react";

/**
 * Bộ render Markdown tối giản — cố tình KHÔNG dùng thư viện ngoài.
 *
 * Chỉ hỗ trợ đúng những gì dữ liệu ghi chú đang dùng:
 *   - dòng bắt đầu bằng "- "  → mục danh sách
 *   - còn lại                 → đoạn văn
 *   - `*chữ*` trong dòng      → nhấn mạnh
 */

type Block =
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string };

/** Gom các dòng "- " liền nhau vào chung một danh sách. */
function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("- ")) {
      const item = line.slice(2).trim();
      const last = blocks.at(-1);
      if (last?.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", items: [item] });
    } else {
      blocks.push({ kind: "para", text: line });
    }
  }

  return blocks;
}

/** Tách `*chữ*` thành <em>, phần còn lại giữ nguyên. */
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
        <em key={index} className="text-ink">
          {part.slice(1, -1)}
        </em>
      ) : (
        part
      ),
    );
}

export function NoteBody({ body }: { body: string }) {
  const blocks = parseBlocks(body);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) =>
        block.kind === "list" ? (
          <ul key={index} className="space-y-2">
            {block.items.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft"
              >
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-300" />
                <span>{inline(item)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index} className="text-[15px] leading-relaxed text-ink-soft">
            {inline(block.text)}
          </p>
        ),
      )}
    </div>
  );
}
