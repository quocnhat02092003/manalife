"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarEvents } from "@/lib/mock";
import type { CalendarEvent } from "@/types";
import { Card } from "@/components/ui/card";
import { Button, IconButton } from "@/components/ui/button";
import { MonthGrid } from "./month-grid";
import { DayPanel } from "./day-panel";

/** Gom sự kiện theo ngày một lần duy nhất — tra cứu O(1) khi vẽ từng ô lưới. */
function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const event of sorted) {
    const key = format(new Date(event.startsAt), "yyyy-MM-dd");
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}

export function CalendarBoard() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => groupByDay(calendarEvents), []);
  const selectedEvents = eventsByDay.get(format(selected, "yyyy-MM-dd")) ?? [];

  /** "Hôm nay" vừa kéo lưới về tháng hiện tại, vừa chọn lại ngày hôm nay. */
  function goToday() {
    setCursor(today);
    setSelected(today);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-5">
          <h2 className="text-[15px] font-semibold text-ink">
            {format(cursor, "'Tháng' M, yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={goToday}>
              Hôm nay
            </Button>
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

        <div className="px-4 pb-5 sm:px-5">
          <MonthGrid
            days={days}
            cursor={cursor}
            today={today}
            selected={selected}
            eventsByDay={eventsByDay}
            onSelect={setSelected}
          />
        </div>
      </Card>

      <DayPanel selected={selected} events={selectedEvents} />
    </div>
  );
}
