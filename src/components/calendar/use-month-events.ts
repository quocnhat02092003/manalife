"use client";

import { useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toast } from "sonner";
import type { CalendarEvent } from "@/types";

/**
 * Tải sự kiện trong một khoảng ngày. Helper thuần — không đụng state — để
 * gọi được từ effect mà không vi phạm react-hooks/set-state-in-effect.
 */
async function fetchEvents(
  from: Date,
  to: Date,
): Promise<
  { ok: true; events: CalendarEvent[] } | { ok: false; message: string }
> {
  try {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      perPage: "100", // Lưới tháng ~42 ngày — theo gợi ý trong docs/api/calendar.md.
    });
    const response = await fetch(`/api/events?${params}`);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return {
        ok: false,
        message: body?.error?.message ?? "Không tải được lịch. Thử lại sau.",
      };
    }
    const { data } = (await response.json()) as { data: CalendarEvent[] };
    return { ok: true, events: data };
  } catch {
    return {
      ok: false,
      message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
    };
  }
}

/**
 * Sự kiện thật cho một lưới lịch tháng (đủ 6 tuần, bắt đầu Thứ Hai).
 *
 * Dùng chung cho trang /calendar và widget lịch ở dashboard: nhận `cursor`
 * (tháng đang xem), trả về các ô ngày của lưới + sự kiện đúng khoảng đó,
 * tự tải lại khi chuyển tháng và huỷ kết quả trễ khi chuyển nhanh.
 * `setEvents` để nơi có thao tác ghi (tạo/sửa/xoá) vá danh sách tại chỗ.
 */
export function useMonthEvents(cursor: Date) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Đổi tháng → hiện trạng thái tải ngay trong lượt render này (pattern
  // "adjust state during render"); effect bên dưới chỉ lo gọi fetch.
  const rangeKey = `${format(days[0], "yyyy-MM-dd")}_${format(days[days.length - 1], "yyyy-MM-dd")}`;
  const [loadedRange, setLoadedRange] = useState<string | null>(null);
  if (loadedRange !== rangeKey) {
    setLoadedRange(rangeKey);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    const from = days[0];
    // Sự kiện của ngày cuối lưới bắt đầu trong ngày đó — lấy tới cuối ngày.
    const to = new Date(days[days.length - 1]);
    to.setHours(23, 59, 59, 999);

    void fetchEvents(from, to).then((result) => {
      if (cancelled) return; // Người dùng đã chuyển tháng khác — bỏ kết quả.
      if (result.ok) setEvents(result.events);
      else toast.error(result.message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // days dẫn xuất thuần từ cursor — rangeKey là đại diện ổn định của nó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  return { days, events, setEvents, loading };
}
