"use client";

import { useState } from "react";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Download } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ExportExcelButtonProps = {
  href: string;
  title: string;
  description: string;
  label?: string;
};

type ExportMode = "range" | "all";

const PRESETS = [
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
  { id: "month", label: "Этот месяц" },
  { id: "all", label: "Все время" },
] as const;

const CALENDAR_START_YEAR = new Date().getFullYear() - 5;
const CALENDAR_END_YEAR = new Date().getFullYear() + 1;

function formatRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) {
    return "Выберите начало и конец периода";
  }
  if (!range.to) {
    return `С ${format(range.from, "d MMM yyyy", { locale: ru })} — выберите конец`;
  }
  return `${format(range.from, "d MMM yyyy", { locale: ru })} — ${format(range.to, "d MMM yyyy", { locale: ru })}`;
}

function buildExportUrl(
  href: string,
  mode: ExportMode,
  range: DateRange | undefined,
): string {
  if (mode === "all") {
    return href;
  }
  if (!range?.from || !range.to) {
    return href;
  }

  const params = new URLSearchParams({
    from: format(range.from, "yyyy-MM-dd"),
    to: format(range.to, "yyyy-MM-dd"),
  });
  return `${href}?${params.toString()}`;
}

export function ExportExcelButton({
  href,
  title,
  description,
  label = "Экспорт в Excel",
}: ExportExcelButtonProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ExportMode>("range");
  const [range, setRange] = useState<DateRange | undefined>();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(now);

  function resetDialog() {
    const today = new Date();
    setMode("range");
    setRange(undefined);
    setActivePreset(null);
    setCalendarMonth(today);
  }

  function applyYearSelection(year: number) {
    const from = startOfYear(new Date(year, 0, 1));
    const to = endOfYear(from);
    setMode("range");
    setActivePreset("calendar-year");
    setRange({ from, to });
    setCalendarMonth(from);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialog();
    }
  }

  function applyPreset(presetId: (typeof PRESETS)[number]["id"]) {
    const today = startOfDay(new Date());
    setActivePreset(presetId);

    if (presetId === "all") {
      setMode("all");
      setRange(undefined);
      return;
    }

    setMode("range");

    if (presetId === "7d") {
      const from = subDays(today, 6);
      setRange({ from, to: endOfDay(today) });
      setCalendarMonth(from);
      return;
    }

    if (presetId === "30d") {
      const from = subDays(today, 29);
      setRange({ from, to: endOfDay(today) });
      setCalendarMonth(from);
      return;
    }

    const from = startOfMonth(today);
    setRange({ from, to: endOfMonth(today) });
    setCalendarMonth(from);
  }

  function handleRangeSelect(nextRange: DateRange | undefined) {
    setMode("range");
    setActivePreset(null);
    setRange(nextRange);
    if (nextRange?.from) {
      setCalendarMonth(startOfMonth(nextRange.from));
    }
  }

  const canExport = mode === "all" || Boolean(range?.from && range?.to);

  async function handleExport() {
    if (!canExport) {
      toast.error("Выберите период для выгрузки");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(buildExportUrl(href, mode, range));
      if (!response.ok) {
        throw new Error("export_failed");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="([^"]+)"/)?.[1] ?? "export.xlsx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
      resetDialog();
    } catch {
      toast.error("Не удалось выгрузить файл");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Download className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-fit sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant={activePreset === preset.id ? "default" : "outline"}
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
              {mode === "range" && (
                <Button
                  type="button"
                  size="sm"
                  variant={
                    activePreset === "calendar-year" ? "default" : "outline"
                  }
                  onClick={() =>
                    applyYearSelection(calendarMonth.getFullYear())
                  }
                >
                  Весь год
                </Button>
              )}
            </div>

            <p
              className={cn(
                "text-sm",
                mode === "all" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {mode === "all"
                ? "Будут выгружены все записи"
                : formatRangeLabel(range)}
            </p>

            {mode === "range" && (
              <Calendar
                mode="range"
                selected={range}
                onSelect={handleRangeSelect}
                locale={ru}
                numberOfMonths={1}
                className="mx-auto"
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                captionLayout="dropdown"
                startMonth={new Date(CALENDAR_START_YEAR, 0)}
                endMonth={new Date(CALENDAR_END_YEAR, 11)}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={loading || !canExport}
            >
              {loading ? "Выгрузка…" : "Скачать Excel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
