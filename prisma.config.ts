import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Cấu hình Prisma CLI.
 *
 * Từ Prisma 7, chuỗi kết nối không còn đặt trong schema.prisma nữa mà nằm ở
 * đây. Đổi sang PostgreSQL khi triển khai: sửa `provider` trong
 * prisma/schema.prisma và trỏ DATABASE_URL sang chuỗi kết nối Postgres.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Chưa có seed. Khi viết `prisma/seed.ts` ở giai đoạn 2, bỏ comment dòng
    // dưới — trỏ vào file không tồn tại sẽ làm `prisma migrate dev` lỗi.
    // seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
