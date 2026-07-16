/**
 * Dữ liệu mẫu cho tầng UI.
 *
 * QUAN TRỌNG — đây là tầng tạm thời. Khi nối API (xem docs/api/), mỗi export
 * trong thư mục này sẽ được thay bằng một lời gọi fetch tương ứng, còn shape
 * dữ liệu giữ nguyên vì đã khớp với src/types và prisma/schema.prisma.
 *
 * Ngày giờ được tính tương đối so với `today` để dữ liệu không bị "cũ" đi.
 */

export * from "./user";
export * from "./calendar";
export * from "./tasks";
export * from "./notes";
export * from "./goals";
export * from "./expenses";
export * from "./habits";
export * from "./email";
export * from "./documents";
export * from "./second-brain";
