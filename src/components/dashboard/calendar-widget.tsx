"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { calendarEvents } from "@/lib/mock";
import { cn, formatTime } from "@/lib/utils";
import type { EventColor } from "@/types";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/button";
import { Dot } from "@/components/ui/badge";

/** Nhãn thứ trong tuần, bắt đầu từ Thứ Hai như ảnh mẫu. */
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const dotColors: Record<EventColor, string> = {
  brand: "bg-brand-600",
  clay: "bg-clay",
  violet: "bg-violet",
  sage: "bg-sage",
  sand: "bg-sand",
};

/**
 * Lịch tháng thu nhỏ + danh sách sự kiện của ngày đang chọn.
 * Chấm màu dưới mỗi ngày cho biết ngày đó có sự kiện gì.
 */
export function CalendarWidget() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  /** Gom sự kiện theo ngày để tra cứu O(1) khi vẽ lưới. */
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventColor[]>();
    for (const event of calendarEvents) {
      const key = format(new Date(event.startsAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      // Tối đa 3 chấm mỗi ô để không phá vỡ chiều cao lưới.
      if (list.length < 3) list.push(event.color);
      map.set(key, list);
    }
    return map;
  }, []);

  const selectedEvents = useMemo(
    () =>
      calendarEvents
        .filter((e) => isSameDay(new Date(e.startsAt), selected))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [selected],
  );

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={19} className="text-brand-600" />
          <h2 className="text-[15px] font-semibold text-ink">
            {format(cursor, "'Tháng' M, yyyy")}
          </h2>
        </div>
        <div className="flex gap-0.5">
          <IconButton
            aria-label="Tháng trước"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            <ChevronLeft size={17} />
          </IconButton>
          <IconButton
            aria-label="Tháng sau"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight size={17} />
          </IconButton>
        </div>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-7 gap-y-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-1.5 text-center text-[11px] font-medium text-ink-faint"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dots = eventsByDay.get(key) ?? [];
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selected);
            const inMonth = isSameMonth(day, cursor);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                aria-label={format(day, "d/M/yyyy")}
                aria-current={isToday ? "date" : undefined}
                className="flex flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[13px] transition-colors",
                    isSelected && "bg-brand-600 font-semibold text-white",
                    !isSelected && isToday && "font-semibold text-brand-700",
                    !isSelected && !isToday && inMonth && "text-ink hover:bg-brand-50",
                    !inMonth && "text-ink-faint",
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {dots.map((color, i) => (
                    <span
                      key={i}
                      className={cn("size-1 rounded-full", dotColors[color])}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 border-t border-line px-5 py-4">
        {selectedEvents.length > 0 ? (
          <ul className="space-y-2.5">
            {selectedEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 text-[13px]">
                <Dot tone={event.color} />
                <span className="w-11 shrink-0 font-medium text-ink-soft">
                  {event.allDay ? "Cả ngày" : formatTime(new Date(event.startsAt))}
                </span>
                <span className="truncate text-ink">{event.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-1 text-[13px] text-ink-faint">
            Không có sự kiện nào trong ngày này.
          </p>
        )}
      </div>
    </Card>
  );
}
