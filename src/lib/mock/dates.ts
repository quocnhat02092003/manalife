/**
 * Neo thời gian cho toàn bộ dữ liệu mẫu.
 *
 * Mọi mock date đều tính tương đối so với `TODAY` để dữ liệu luôn trông "sống"
 * dù bạn mở app vào ngày nào. Dùng giờ cố định (12:00) làm gốc để tránh lệch
 * ngày do múi giờ khi render trên server rồi hydrate lại ở client.
 */

import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns";

/** Gốc thời gian: 12:00 hôm nay theo giờ máy. */
export const TODAY = setHours(startOfDay(new Date()), 12);

/** ISO string của `TODAY` cộng thêm `days` ngày, tại giờ:phút chỉ định. */
export function at(days: number, hour = 9, minute = 0): string {
  return setMinutes(setHours(addDays(TODAY, days), hour), minute).toISOString();
}

/** Chuỗi "YYYY-MM-DD" của `TODAY` cộng thêm `days` ngày. */
export function dayKey(days: number): string {
  return format(addDays(TODAY, days), "yyyy-MM-dd");
}
