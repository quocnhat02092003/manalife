import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client dùng chung.
 *
 * Ở chế độ dev, Next.js hot-reload sẽ nạp lại module này mỗi lần sửa file. Nếu
 * cứ `new PrismaClient()` mỗi lần thì sau vài chục lần lưu file sẽ cạn kết nối,
 * nên client được gắn vào `globalThis` để dùng lại. Ở production không cần —
 * module chỉ nạp một lần.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Thiếu biến môi trường DATABASE_URL. Sao chép .env.example thành .env.",
    );
  }
  // Prisma 7 kết nối qua driver adapter thay vì engine nhị phân.
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
