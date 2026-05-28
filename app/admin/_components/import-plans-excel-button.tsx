"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PlanImportRowResult = {
  rowNumber: number;
  planId: string | null;
  name: string | null;
  valid: boolean;
  errors: string[];
  warnings: string[];
  input?: Record<string, unknown>;
};

type PlanImportValidationResult = {
  rows: PlanImportRowResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    skipped: number;
  };
  sheetError?: string;
};

type ImportPlansExcelButtonProps = {
  label?: string;
};

export function ImportPlansExcelButton({
  label = "Импорт из Excel",
}: ImportPlansExcelButtonProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validation, setValidation] = useState<PlanImportValidationResult | null>(
    null,
  );

  function resetDialog() {
    setFileName(null);
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialog();
    }
  }

  async function handleTemplateDownload() {
    try {
      const response = await fetch("/api/admin/plans/import/template");
      if (!response.ok) {
        throw new Error("template_failed");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="([^"]+)"/)?.[1] ??
        "plans-import-template.xlsx";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Не удалось скачать шаблон");
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setValidation(null);
    setValidating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/plans/import/validate", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as PlanImportValidationResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "validation_failed");
      }

      setValidation(data);
    } catch (error) {
      const message =
        error instanceof Error && error.message !== "validation_failed"
          ? error.message
          : "Не удалось проверить файл";
      toast.error(message);
      setValidation(null);
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    const validRows = validation?.rows.filter((row) => row.valid && row.input) ?? [];
    if (validRows.length === 0) {
      toast.error("Нет корректных строк для импорта");
      return;
    }

    setImporting(true);
    try {
      const response = await fetch("/api/admin/plans/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map((row) => row.input),
        }),
      });
      const data = (await response.json()) as {
        created: number;
        updated: number;
        failed: { id: string; error: string }[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "import_failed");
      }

      const parts: string[] = [];
      if (data.created > 0) parts.push(`создано: ${data.created}`);
      if (data.updated > 0) parts.push(`обновлено: ${data.updated}`);
      if (data.failed.length > 0) parts.push(`ошибок: ${data.failed.length}`);

      toast.success(
        parts.length > 0 ? `Импорт завершён (${parts.join(", ")})` : "Импорт завершён",
      );

      if (data.failed.length > 0) {
        toast.error(
          data.failed
            .slice(0, 3)
            .map((item) => `${item.id}: ${item.error}`)
            .join("; "),
        );
      }

      setOpen(false);
      resetDialog();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message !== "import_failed"
          ? error.message
          : "Не удалось импортировать тарифы";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  }

  const validCount = validation?.summary.valid ?? 0;
  const canImport = validCount > 0 && !validating && !importing;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Upload className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle>Импорт тарифов из Excel</DialogTitle>
            <DialogDescription>
              Скачайте шаблон, заполните лист «Тарифы» и загрузите файл. Ошибки
              проверяются до импорта.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTemplateDownload}
              >
                <FileUp className="size-4" />
                Скачать шаблон
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={validating}
              >
                {validating ? "Проверка…" : "Выбрать файл"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            {fileName && (
              <p className="text-sm text-muted-foreground">Файл: {fileName}</p>
            )}

            {validation?.sheetError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {validation.sheetError}
              </p>
            )}

            {validation && !validation.sheetError && (
              <>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">Всего: {validation.summary.total}</Badge>
                  <Badge variant="default">Корректно: {validation.summary.valid}</Badge>
                  {validation.summary.invalid > 0 && (
                    <Badge variant="destructive">
                      Ошибки: {validation.summary.invalid}
                    </Badge>
                  )}
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Стр.</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validation.rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            Нет строк с данными
                          </TableCell>
                        </TableRow>
                      ) : (
                        validation.rows.map((row) => (
                          <TableRow
                            key={row.rowNumber}
                            className={cn(!row.valid && "bg-destructive/5")}
                          >
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {row.planId ?? "—"}
                            </TableCell>
                            <TableCell>{row.name ?? "—"}</TableCell>
                            <TableCell>
                              {row.valid ? (
                                <div className="space-y-1">
                                  <Badge variant="secondary">OK</Badge>
                                  {row.warnings.map((warning) => (
                                    <p
                                      key={warning}
                                      className="text-xs text-amber-600 dark:text-amber-500"
                                    >
                                      {warning}
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <ul className="space-y-0.5 text-xs text-destructive">
                                  {row.errors.map((error) => (
                                    <li key={error}>{error}</li>
                                  ))}
                                </ul>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={importing}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!canImport}
            >
              {importing
                ? "Импорт…"
                : `Импортировать${validCount > 0 ? ` (${validCount})` : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
