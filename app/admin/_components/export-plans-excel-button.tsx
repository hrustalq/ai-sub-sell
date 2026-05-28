"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { ProviderMeta } from "@/lib/plans/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";

const LIMIT_OPTIONS = [
  { id: "50", label: "50 тарифов" },
  { id: "100", label: "100 тарифов" },
  { id: "500", label: "500 тарифов" },
  { id: "all", label: "Все тарифы" },
] as const;

type ExportPlansExcelButtonProps = {
  providers: ProviderMeta[];
  label?: string;
};

function buildExportUrl(selectedProviderIds: string[], limit: string): string {
  const params = new URLSearchParams({ limit });
  for (const providerId of selectedProviderIds) {
    params.append("provider", providerId);
  }
  return `/api/admin/plans/export?${params.toString()}`;
}

function formatExportSummary(
  selectedProviderIds: string[],
  allProviderIds: string[],
  providers: ProviderMeta[],
  limit: string,
) {
  const limitLabel =
    LIMIT_OPTIONS.find((option) => option.id === limit)?.label ??
    `${limit} тарифов`;

  if (selectedProviderIds.length === 0) {
    return `${limitLabel} · выберите провайдеров`;
  }

  if (selectedProviderIds.length === allProviderIds.length) {
    return `${limitLabel} · все провайдеры`;
  }

  if (selectedProviderIds.length <= 2) {
    const labels = selectedProviderIds.map(
      (id) => providers.find((provider) => provider.id === id)?.label ?? id,
    );
    return `${limitLabel} · ${labels.join(", ")}`;
  }

  return `${limitLabel} · ${selectedProviderIds.length} провайдеров`;
}

function allProviderIds(providers: ProviderMeta[]) {
  return providers.map((provider) => provider.id);
}

export function ExportPlansExcelButton({
  providers,
  label = "Экспорт в Excel",
}: ExportPlansExcelButtonProps) {
  const providerIds = useMemo(() => allProviderIds(providers), [providers]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [limit, setLimit] = useState<(typeof LIMIT_OPTIONS)[number]["id"]>("100");

  function resetDialog() {
    setSelectedProviderIds(providerIds);
    setLimit("100");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedProviderIds(providerIds);
    } else {
      resetDialog();
    }
  }

  function toggleProvider(providerId: string, checked: boolean) {
    setSelectedProviderIds((prev) => {
      if (checked) {
        return prev.includes(providerId) ? prev : [...prev, providerId];
      }
      return prev.filter((id) => id !== providerId);
    });
  }

  function selectAllProviders() {
    setSelectedProviderIds(providerIds);
  }

  function clearProviders() {
    setSelectedProviderIds([]);
  }

  const exportsAllProviders =
    selectedProviderIds.length === providerIds.length && providerIds.length > 0;
  const canExport = selectedProviderIds.length > 0;

  async function handleExport() {
    if (!canExport) {
      toast.error("Выберите хотя бы одного провайдера");
      return;
    }

    setLoading(true);
    try {
      const url = exportsAllProviders
        ? `/api/admin/plans/export?limit=${limit}`
        : buildExportUrl(selectedProviderIds, limit);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("export_failed");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="([^"]+)"/)?.[1] ?? "plans.xlsx";

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(blobUrl);
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Экспорт тарифов</DialogTitle>
            <DialogDescription>
              Выберите провайдеров и сколько тарифов выгрузить. Порядок в файле
              совпадает с группировкой на странице.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>Провайдеры</FieldLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectAllProviders}
                  >
                    Все
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearProviders}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                {providers.map((provider) => {
                  const checkboxId = `export-provider-${provider.id}`;
                  return (
                    <div key={provider.id} className="flex items-start gap-2">
                      <Checkbox
                        id={checkboxId}
                        checked={selectedProviderIds.includes(provider.id)}
                        onCheckedChange={(checked) =>
                          toggleProvider(provider.id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={checkboxId}
                        className="cursor-pointer text-sm leading-snug font-normal"
                      >
                        {provider.label}
                        {!provider.active && (
                          <span className="text-muted-foreground">
                            {" "}
                            (скрыт)
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </Field>

            <Field>
              <FieldLabel>Количество</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {LIMIT_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={limit === option.id ? "default" : "outline"}
                    onClick={() => setLimit(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </Field>

            <p className="text-sm text-muted-foreground">
              {formatExportSummary(
                selectedProviderIds,
                providerIds,
                providers,
                limit,
              )}
            </p>
          </FieldGroup>

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
