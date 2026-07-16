import { format, getDay } from "date-fns";
import { CalendarOff, Clock, MapPin } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { eventStripe } from "./event-colors";

/** Tên thứ đầy đủ, tra theo getDay() nên phải bắt đầu từ Chủ nhật. */
const FULL_WEEKDAYS = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

interface DayPanelProps {
  selected: Date;
  events: CalendarEvent[];
}

export function DayPanel({ selected, events }: DayPanelProps) {
  return (
    <Card className="flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[13px] font-medium text-ink-soft">
          {FULL_WEEKDAYS[getDay(selected)]}
        </p>
        <h2 className="mt-0.5 text-[15px] font-semibold text-ink">
          {format(selected, "d 'tháng' M, yyyy")}
        </h2>
        <p className="mt-1 text-[13px] text-ink-faint">
          {events.length > 0
            ? `${events.length} sự kiện`
            : "Chưa có sự kiện nào"}
        </p>
      </div>

      <div className="border-t border-line">
        {events.length > 0 ? (
          <ul className="space-y-2.5 p-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="relative rounded-xl border border-line bg-surface p-3 pl-4"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 bottom-3 left-1.5 w-1 rounded-full",
                    eventStripe[event.color],
                  )}
                />
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="shrink-0 text-ink-faint" />
                  <span className="text-[12px] font-medium text-ink-soft">
                    {event.allDay
                      ? "Cả ngày"
                      : `${formatTime(new Date(event.startsAt))} – ${formatTime(new Date(event.endsAt))}`}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-ink">
                  {event.title}
                </p>

                {event.location ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <MapPin size={13} className="shrink-0 text-ink-faint" />
                    <span className="truncate text-[12px] text-ink-soft">
                      {event.location}
                    </span>
                  </div>
                ) : null}

                {event.description ? (
                  <p className="mt-1.5 text-[13px] text-ink-soft">
                    {event.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarOff}
            title="Ngày trống"
            description="Không có sự kiện nào trong ngày này. Chọn một ngày khác hoặc thêm sự kiện mới."
          />
        )}
      </div>
    </Card>
  );
}
