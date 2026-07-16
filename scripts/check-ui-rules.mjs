#!/usr/bin/env node
/**
 * Kiểm tra các quy tắc giao diện bất di bất dịch (xem docs/ui-guidelines.md).
 *
 * Chạy: npm run check:ui
 *
 * Viết bằng Node thuần thay vì grep để chạy được trên cả Windows lẫn Unix mà
 * không phụ thuộc shell.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Thư mục bỏ qua: code sinh tự động không thuộc quyền kiểm soát của ta. */
const SKIP_DIRS = new Set(["generated", "node_modules", ".next"]);

const RULES = [
  {
    name: "Không dùng tracking (letter-spacing)",
    // Bắt class Tailwind tracking-* trong JSX/TS.
    pattern: /\btracking-(tighter|tight|normal|wide|wider|widest|\[)/g,
    extensions: [".tsx", ".ts", ".css"],
  },
  {
    name: "Không dùng gradient",
    pattern: /\b(bg-gradient-to-|linear-gradient|radial-gradient|conic-gradient|from-\[|via-\[)/g,
    extensions: [".tsx", ".ts", ".css"],
  },
  {
    name: "Không dùng bảng màu mặc định của Tailwind",
    // Chỉ dùng token khai báo trong globals.css.
    pattern:
      /\b(bg|text|border|ring|fill|stroke|from|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    extensions: [".tsx", ".ts", ".css"],
  },
  {
    name: "Icon phải đến từ lucide-react",
    pattern: /from\s+["'](react-icons|@heroicons\/|@tabler\/icons)/g,
    extensions: [".tsx", ".ts"],
  },
];

/** Bỏ qua dòng comment — comment nhắc "không dùng gradient" không phải vi phạm. */
function isComment(line) {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("*") ||
    t.startsWith("/*") ||
    t.startsWith("<!--")
  );
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

const violations = [];

for await (const file of walk(SRC)) {
  const applicable = RULES.filter((rule) =>
    rule.extensions.some((ext) => file.endsWith(ext)),
  );
  if (applicable.length === 0) continue;

  const content = await readFile(file, "utf8");
  const lines = content.split("\n");

  for (const rule of applicable) {
    lines.forEach((line, i) => {
      if (isComment(line)) return;
      // Reset lastIndex vì regex có cờ /g và được dùng lại giữa các dòng.
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(line);
      if (match) {
        violations.push({
          rule: rule.name,
          file: relative(ROOT, file),
          line: i + 1,
          text: line.trim().slice(0, 100),
          match: match[0],
        });
      }
    });
  }
}

if (violations.length === 0) {
  console.log("✓ Giao diện tuân thủ đủ 4 quy tắc trong docs/ui-guidelines.md");
  process.exit(0);
}

console.error(`✗ Tìm thấy ${violations.length} vi phạm:\n`);
for (const v of violations) {
  console.error(`  [${v.rule}]`);
  console.error(`  ${v.file}:${v.line} — khớp "${v.match}"`);
  console.error(`    ${v.text}\n`);
}
console.error("Xem docs/ui-guidelines.md để biết cách sửa.");
process.exit(1);
