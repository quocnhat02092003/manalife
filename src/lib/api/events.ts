import { endOfDay, startOfDay } from "date-fns";
import type { CalendarEvent, EventColor } from "@/types";

/**
 * Tầng chuyển đổi + kiểm tra dữ liệu cho module Lịch (docs/api/calendar.md).
 * Cả POST lẫn PATCH đi qua cùng một chỗ để hai đường không lệch quy tắc.
 */

export const EVENT_COLORS: readonly EventColor[] = [
  "brand",
  "clay",
  "violet",
  "sage",
  "sand",
];

/** Các cột được phép ra ngoài — KHÔNG có userId, createdAt, updatedAt. */
export const eventSelect = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  allDay: true,
  location: true,
  color: true,
} as const;

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  location: string | null;
  color: string;
}

export function toEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    allDay: row.allDay,
    location: row.location,
    color: row.color as EventColor,
  };
}

/** Dữ liệu đã kiểm tra xong, sẵn sàng đưa vào Prisma. */
export interface EventData {
  title?: string;
  description?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  allDay?: boolean;
  location?: string | null;
  color?: EventColor;
}

export type EventValidation =
  | { ok: true; data: EventData }
  | { ok: false; status: 400 | 422; fields?: Record<string, string>; message: string };

/**
 * Kiểm tra body của POST/PATCH.
 *
 * - `mode: "create"` bắt buộc title/startsAt/endsAt; `"patch"` mọi trường
 *   tuỳ chọn, trường vắng mặt giữ nguyên.
 * - Với PATCH, quy tắc "endsAt phải sau startsAt" kiểm tra trên giá trị SAU
 *   KHI GHÉP với bản ghi hiện tại (`existing`) — client có thể chỉ gửi mỗi
 *   endsAt.
 * - `allDay = true`: chuẩn hoá startsAt về đầu ngày, endsAt về cuối ngày
 *   TRƯỚC khi kiểm tra quy tắc trên — nếu không, sự kiện cả ngày mà client
 *   gửi hai mốc giờ bằng nhau sẽ bị 422 oan.
 */
export function validateEvent(
  input: Record<string, unknown>,
  mode: "create" | "patch",
  existing?: { startsAt: Date; endsAt: Date; allDay: boolean },
): EventValidation {
  const fields: Record<string, string> = {};
  const data: EventData = {};

  if ("title" in input || mode === "create") {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length < 1 || title.length > 200) {
      fields.title = "Tiêu đề phải dài 1–200 ký tự.";
    } else {
      data.title = title;
    }
  }

  if ("description" in input) {
    if (input.description === null) data.description = null;
    else if (typeof input.description === "string") {
      if (input.description.length > 2000) {
        fields.description = "Mô tả tối đa 2000 ký tự.";
      } else {
        data.description = input.description;
      }
    } else {
      fields.description = "Mô tả phải là chuỗi hoặc null.";
    }
  }

  if ("location" in input) {
    if (input.location === null) data.location = null;
    else if (typeof input.location === "string") {
      const location = input.location.trim();
      if (location.length > 200) {
        fields.location = "Địa điểm tối đa 200 ký tự.";
      } else {
        data.location = location || null;
      }
    } else {
      fields.location = "Địa điểm phải là chuỗi hoặc null.";
    }
  }

  if ("color" in input) {
    if (EVENT_COLORS.includes(input.color as EventColor)) {
      data.color = input.color as EventColor;
    } else {
      fields.color = "Màu phải là brand | clay | violet | sage | sand.";
    }
  }

  if ("allDay" in input) {
    if (typeof input.allDay === "boolean") data.allDay = input.allDay;
    else fields.allDay = "allDay phải là boolean.";
  }

  for (const key of ["startsAt", "endsAt"] as const) {
    if (key in input || mode === "create") {
      const value = typeof input[key] === "string" ? new Date(input[key]) : null;
      if (!value || Number.isNaN(value.getTime())) {
        fields[key] = "Phải là chuỗi ngày giờ ISO 8601.";
      } else {
        data[key] = value;
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, status: 400, fields, message: "Dữ liệu không hợp lệ." };
  }
  if (mode === "patch" && Object.keys(data).length === 0) {
    return {
      ok: false,
      status: 400,
      message: "Body rỗng — không có gì để sửa.",
    };
  }

  // Ghép với bản ghi hiện tại (PATCH) rồi mới xét nghiệp vụ.
  const allDay = data.allDay ?? existing?.allDay ?? false;
  let startsAt = data.startsAt ?? existing?.startsAt;
  let endsAt = data.endsAt ?? existing?.endsAt;

  if (startsAt && endsAt) {
    if (allDay) {
      // Chuẩn hoá TRƯỚC khi kiểm tra endsAt > startsAt (quy tắc 3 + 4).
      startsAt = startOfDay(startsAt);
      endsAt = new Date(endOfDay(endsAt).setSeconds(0, 0)); // 23:59:00
    }
    if (endsAt <= startsAt) {
      return {
        ok: false,
        status: 422,
        message: "Thời điểm kết thúc phải sau thời điểm bắt đầu.",
      };
    }
    // Ghi lại giá trị đã chuẩn hoá nếu là sự kiện cả ngày. Khi PATCH đổi mỗi
    // allDay, hai mốc giờ ghép từ bản ghi cũ cũng phải được chuẩn hoá lại.
    if (allDay) {
      data.startsAt = startsAt;
      data.endsAt = endsAt;
    }
  }

  return { ok: true, data };
}
