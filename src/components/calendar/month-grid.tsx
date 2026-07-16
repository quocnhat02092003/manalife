"use client";

import { format, isSameDay, isSameMonth } from "date-fns";
import { cn, formatTime } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { eventBar } from "./event-colors";

/** Nhãn thứ trong tuần, bắt đầu từ Thứ Hai (weekStartsOn: 1). */
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Số thanh sự kiện tối đa hiện trong một ô trước khi gộp thành "+N nữa". */
const MAX_VISIBLE = 3;

interface MonthGridProps {
  days: Date[];
  cursor: Date;
  today: Date;
  selected: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelect: (day: Date) => void;
}

export function MonthGrid({
  days,
  cursor,
  today,
  selected,
  eventsByDay,
  onSelect,
}: MonthGridProps) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-px pb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-medium text-ink-faint"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Nền `bg-line` lộ ra qua khe gap-px, tạo đường kẻ 1px giữa các ô. */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const events = eventsByDay.get(key) ?? [];
          const visible = events.slice(0, MAX_VISIBLE);
          const hidden = events.length - visible.length;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selected);
          const inMonth = isSameMonth(day, cursor);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={format(day, "d/M/yyyy")}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-[100px] flex-col items-start gap-1 p-1.5 text-left transition-colors",
                inMonth ? "bg-surface" : "bg-surface-muted",
                isSelected
                  ? "bg-brand-50 ring-2 ring-brand-600 ring-inset"
                  : "hover:bg-brand-50",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px]",
                  isToday && "bg-brand-600 font-semibold text-white",
                  !isToday && isSelected && "font-semibold text-brand-700",
                  !isToday && !isSelected && inMonth && "text-ink",
                  !isToday && !inMonth && "text-ink-faint",
                )}
              >
                {format(day, "d")}
              </span>

              <span className="flex w-full flex-col gap-0.5">
                {visible.map((event) => (
                  <span
                    key={event.id}
                    className={cn(
                      "block truncate rounded px-1.5 py-0.5 text-[11px] leading-4 font-medium",
                      eventBar[event.color],
                    )}
                  >
                    {event.allDay
                      ? event.title
                      : `${formatTime(new Date(event.startsAt))} ${event.title}`}
                  </span>
                ))}
                {hidden > 0 ? (
                  <span className="px-1.5 text-[11px] leading-4 font-medium text-ink-faint">
                    +{hidden} nữa
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
