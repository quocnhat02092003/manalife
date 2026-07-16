"use client";

import { useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/lib/notifications";
import type { CalendarEvent, Task } from "@/types";
import { Card } from "@/components/ui/card";
import { Button, IconButton } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { MonthGrid } from "./month-grid";
import { DayPanel } from "./day-panel";
import { EventDialog } from "./event-dialog";
import { useMonthEvents } from "./use-month-events";

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

/**
 * Bảng lịch tháng chạy trên dữ liệu thật: tải sự kiện đúng khoảng lưới đang
 * xem (useMonthEvents), tạo/sửa qua EventDialog, xoá sau AlertDialog xác
 * nhận. Sau mỗi thao tác thành công, danh sách được vá tại chỗ — không cần
 * refetch cả tháng.
 */
export function CalendarBoard() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);

  const { days, events, setEvents, tasks, setTasks, loading } = useMonthEvents(
    cursor,
    { includeTasks: true },
  );

  const [dialog, setDialog] = useState<{
    open: boolean;
    event: CalendarEvent | null;
  }>({ open: false, event: null });
  const [pendingDelete, setPendingDelete] = useState<CalendarEvent | null>(
    null,
  );

  const eventsByDay = useMemo(() => groupByDay(events), [events]);

  // Việc có hạn gom theo ngày — cùng chìa khoá yyyy-MM-dd với sự kiện.
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    const sorted = [...tasks].sort((a, b) =>
      (a.dueAt ?? "").localeCompare(b.dueAt ?? ""),
    );
    for (const task of sorted) {
      if (!task.dueAt) continue;
      const key = format(new Date(task.dueAt), "yyyy-MM-dd");
      const list = map.get(key);
      if (list) list.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const selectedTasks = tasksByDay.get(selectedKey) ?? [];

  /** "Hôm nay" vừa kéo lưới về tháng hiện tại, vừa chọn lại ngày hôm nay. */
  function goToday() {
    setCursor(today);
    setSelected(today);
  }

  function handleSaved(event: CalendarEvent, mode: "create" | "edit") {
    setEvents((prev) =>
      mode === "create"
        ? [...prev, event]
        : prev.map((item) => (item.id === event.id ? event : item)),
    );
    // Toast (trong EventDialog) là phản hồi tức thời; chuông ở header giữ
    // lại lịch sử để xem lại sau.
    notify({
      title:
        mode === "create"
          ? `Đã thêm sự kiện "${event.title}"`
          : `Đã cập nhật sự kiện "${event.title}"`,
      description: event.allDay
        ? `Cả ngày ${format(new Date(event.startsAt), "d/M/yyyy")}`
        : format(new Date(event.startsAt), "HH:mm 'ngày' d/M/yyyy"),
      href: "/calendar",
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const response = await fetch(`/api/events/${target.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      toast.error(body?.error?.message ?? "Không xoá được sự kiện.");
      return;
    }

    setEvents((prev) => prev.filter((item) => item.id !== target.id));
    toast.success(`Đã xoá "${target.title}".`);
    notify({
      title: `Đã xoá sự kiện "${target.title}"`,
      description: format(new Date(target.startsAt), "'Ngày' d/M/yyyy"),
      href: "/calendar",
    });
  }

  /** Tick việc ngay trên lịch — cùng /toggle với trang Công việc. */
  async function handleToggleTask(target: Task) {
    const before = tasks;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === target.id
          ? { ...task, status: task.status === "done" ? "todo" : "done" }
          : task,
      ),
    );

    const response = await fetch(`/api/tasks/${target.id}/toggle`, {
      method: "PATCH",
    });
    if (!response.ok) {
      setTasks(before);
      toast.error("Không cập nhật được công việc. Thử lại sau.");
      return;
    }
    const { data } = (await response.json()) as { data: Task };
    setTasks((prev) =>
      prev.map((task) => (task.id === target.id ? data : task)),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            {format(cursor, "'Tháng' M, yyyy")}
            {loading ? (
              <Loader2
                size={14}
                className="animate-spin text-ink-faint"
                aria-label="Đang tải sự kiện"
              />
            ) : null}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => setDialog({ open: true, event: null })}
            >
              <Plus size={15} />
              Thêm sự kiện
            </Button>
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
            tasksByDay={tasksByDay}
            onSelect={setSelected}
          />
        </div>
      </Card>

      <DayPanel
        selected={selected}
        events={selectedEvents}
        tasks={selectedTasks}
        onAdd={() => setDialog({ open: true, event: null })}
        onEdit={(event) => setDialog({ open: true, event })}
        onDelete={setPendingDelete}
        onToggleTask={handleToggleTask}
      />

      <EventDialog
        open={dialog.open}
        onOpenChange={(open) =>
          setDialog((prev) => ({ open, event: open ? prev.event : null }))
        }
        event={dialog.event}
        defaultDate={selected}
        onSaved={handleSaved}
      />

      {/* Xác nhận xoá — xoá sự kiện là vĩnh viễn, không có thùng rác. */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xoá sự kiện &quot;{pendingDelete?.title}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sự kiện sẽ bị xoá vĩnh viễn. Không hoàn tác được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-danger text-white hover:bg-danger/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
