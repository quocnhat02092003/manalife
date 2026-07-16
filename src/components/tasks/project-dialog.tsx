"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EventColor, Project } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { eventStripe } from "@/components/calendar/event-colors";

const COLOR_OPTIONS: { value: EventColor; label: string }[] = [
  { value: "brand", label: "Xanh rêu" },
  { value: "clay", label: "Đất nung" },
  { value: "violet", label: "Tím" },
  { value: "sage", label: "Xanh xô thơm" },
  { value: "sand", label: "Cát" },
];

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: Project) => void;
}

/** Hộp thoại tạo dự án — POST /api/projects. */
export function ProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: ProjectDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<EventColor>("brand");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form mỗi lần mở — pattern "adjust state during render".
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setColor("brand");
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên dự án.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (response.ok) {
        const { data } = (await response.json()) as { data: Project };
        onCreated(data);
        onOpenChange(false);
        toast.success(`Đã tạo dự án "${data.name}".`);
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string; fields?: Record<string, string> };
      } | null;
      setError(
        body?.error?.fields?.name ??
          body?.error?.message ??
          "Có lỗi xảy ra. Thử lại sau.",
      );
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dự án mới</DialogTitle>
          <DialogDescription>
            Dự án gom nhóm công việc — ví dụ &quot;Công việc&quot;, &quot;Cá
            nhân&quot;, &quot;Side Project&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Tên dự án" htmlFor="project-name" error={error ?? undefined}>
            <Input
              id="project-name"
              placeholder="Side Project…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(error)}
            />
          </Field>

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
                  aria-pressed={color === value}
                  onClick={() => setColor(value)}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full transition-shadow",
                    color === value &&
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
                  Đang tạo…
                </>
              ) : (
                "Tạo dự án"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
