"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CalendarEvent, EventColor } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { eventStripe } from "./event-colors";

const COLOR_OPTIONS: { value: EventColor; label: string }[] = [
  { value: "brand", label: "Xanh rêu" },
  { value: "clay", label: "Đất nung" },
  { value: "violet", label: "Tím" },
  { value: "sage", label: "Xanh xô thơm" },
  { value: "sand", label: "Cát" },
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Có mặt = sửa sự kiện này; vắng mặt = tạo mới. */
  event?: CalendarEvent | null;
  /** Ngày đang chọn trên lưới — làm mặc định khi tạo mới. */
  defaultDate: Date;
  /** Gọi sau khi server xác nhận — board cập nhật danh sách tại chỗ. */
  onSaved: (event: CalendarEvent, mode: "create" | "edit") => void;
}

interface FormState {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
  color: EventColor;
}

function initialForm(event: CalendarEvent | null, defaultDate: Date): FormState {
  if (event) {
    const starts = new Date(event.startsAt);
    const ends = new Date(event.endsAt);
    return {
      title: event.title,
      startDate: format(starts, "yyyy-MM-dd"),
      startTime: format(starts, "HH:mm"),
      endDate: format(ends, "yyyy-MM-dd"),
      endTime: format(ends, "HH:mm"),
      allDay: event.allDay,
      location: event.location ?? "",
      description: event.description ?? "",
      color: event.color,
    };
  }
  const day = format(defaultDate, "yyyy-MM-dd");
  return {
    title: "",
    startDate: day,
    startTime: "09:00",
    endDate: day,
    endTime: "10:00",
    allDay: false,
    location: "",
    description: "",
    color: "brand",
  };
}

/** Hộp thoại tạo/sửa sự kiện — gọi POST hoặc PATCH /api/events. */
export function EventDialog({
  open,
  onOpenChange,
  event = null,
  defaultDate,
  onSaved,
}: EventDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    initialForm(event, defaultDate),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Nạp lại form mỗi lần MỞ — pattern "adjust state during render", vì mỗi
  // lượt mở có thể là sự kiện khác (sửa) hoặc ngày khác (tạo).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initialForm(event, defaultDate));
      setErrors({});
    }
  }

  function patch(update: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const found: Record<string, string> = {};
    if (!form.title.trim()) found.title = "Vui lòng nhập tiêu đề.";
    if (!form.startDate) found.startsAt = "Vui lòng chọn ngày bắt đầu.";
    if (!form.endDate) found.endsAt = "Vui lòng chọn ngày kết thúc.";

    // Sự kiện cả ngày chỉ cần ngày; giờ do server chuẩn hoá (00:00 → 23:59).
    const startsAt = new Date(
      `${form.startDate}T${form.allDay ? "00:00" : form.startTime}`,
    );
    const endsAt = new Date(
      `${form.endDate}T${form.allDay ? "12:00" : form.endTime}`,
    );
    if (!found.startsAt && Number.isNaN(startsAt.getTime())) {
      found.startsAt = "Thời điểm bắt đầu không hợp lệ.";
    }
    if (!found.endsAt && Number.isNaN(endsAt.getTime())) {
      found.endsAt = "Thời điểm kết thúc không hợp lệ.";
    }
    if (
      !found.startsAt &&
      !found.endsAt &&
      !form.allDay &&
      endsAt <= startsAt
    ) {
      found.endsAt = "Kết thúc phải sau bắt đầu.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      allDay: form.allDay,
      location: form.location.trim() || null,
      color: form.color,
    };

    setSaving(true);
    try {
      const response = await fetch(
        event ? `/api/events/${event.id}` : "/api/events",
        {
          method: event ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        const { data } = (await response.json()) as { data: CalendarEvent };
        onSaved(data, event ? "edit" : "create");
        onOpenChange(false);
        toast.success(event ? "Đã cập nhật sự kiện." : "Đã thêm sự kiện.");
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string; fields?: Record<string, string> };
      } | null;
      if (body?.error?.fields) setErrors(body.error.fields);
      else toast.error(body?.error?.message ?? "Có lỗi xảy ra. Thử lại sau.");
    } catch {
      toast.error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Sửa sự kiện" : "Thêm sự kiện"}</DialogTitle>
          <DialogDescription>
            {event
              ? "Chỉnh sửa chi tiết rồi bấm Lưu."
              : "Điền chi tiết cho sự kiện mới trên lịch của bạn."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Tiêu đề" htmlFor="event-title" error={errors.title}>
            <Input
              id="event-title"
              placeholder="Họp đội ngũ, sinh nhật, chạy bộ…"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              aria-invalid={Boolean(errors.title)}
            />
          </Field>

          <label className="flex w-fit cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={form.allDay}
              onCheckedChange={(allDay) => patch({ allDay })}
              label="Sự kiện cả ngày"
            />
            <span className="text-[13px] font-medium text-ink-soft">
              Cả ngày
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Bắt đầu"
              htmlFor="event-start-date"
              error={errors.startsAt}
            >
              <div className="space-y-2">
                <Input
                  id="event-start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => patch({ startDate: e.target.value })}
                  aria-invalid={Boolean(errors.startsAt)}
                />
                {!form.allDay ? (
                  <Input
                    type="time"
                    aria-label="Giờ bắt đầu"
                    value={form.startTime}
                    onChange={(e) => patch({ startTime: e.target.value })}
                  />
                ) : null}
              </div>
            </Field>

            <Field
              label="Kết thúc"
              htmlFor="event-end-date"
              error={errors.endsAt}
            >
              <div className="space-y-2">
                <Input
                  id="event-end-date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => patch({ endDate: e.target.value })}
                  aria-invalid={Boolean(errors.endsAt)}
                />
                {!form.allDay ? (
                  <Input
                    type="time"
                    aria-label="Giờ kết thúc"
                    value={form.endTime}
                    onChange={(e) => patch({ endTime: e.target.value })}
                  />
                ) : null}
              </div>
            </Field>
          </div>

          <Field label="Địa điểm" htmlFor="event-location" error={errors.location}>
            <Input
              id="event-location"
              placeholder="Google Meet, quán cà phê… (tuỳ chọn)"
              value={form.location}
              onChange={(e) => patch({ location: e.target.value })}
            />
          </Field>

          <Field
            label="Mô tả"
            htmlFor="event-description"
            error={errors.description}
          >
            <textarea
              id="event-description"
              rows={3}
              placeholder="Ghi chú thêm… (tuỳ chọn)"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-2 focus:outline-brand-500"
            />
          </Field>

          {/* Chọn màu: 5 chấm tròn, đúng tập EventColor. */}
          <fieldset>
            <legend className="text-[13px] font-medium text-ink-soft">
              Màu
            </legend>
            <div className="mt-2 flex gap-2">
              {COLOR_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={`Màu ${label}`}
                  aria-pressed={form.color === value}
                  onClick={() => patch({ color: value })}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full transition-shadow",
                    form.color === value &&
                      "ring-2 ring-brand-600 ring-offset-2 ring-offset-surface",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-4.5 rounded-full", eventStripe[value])}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu…
                </>
              ) : event ? (
                "Lưu thay đổi"
              ) : (
                "Thêm sự kiện"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
