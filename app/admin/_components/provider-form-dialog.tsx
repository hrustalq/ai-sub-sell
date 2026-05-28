"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProviderMeta } from "@/lib/plans/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

type ProviderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  provider?: ProviderMeta;
};

export function ProviderFormDialog({
  open,
  onOpenChange,
  mode,
  provider,
}: ProviderFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setLoading(false);
    setId(provider?.id ?? "");
    setLabel(provider?.label ?? "");
    setDescription(provider?.description ?? "");
    setSortOrder(provider != null ? String(provider.sortOrder) : "0");
    setActive(provider?.active !== false);
  }, [open, provider]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...(mode === "create" ? { id: id.trim().toLowerCase() } : {}),
      label: label.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder),
      active,
    };

    const url =
      mode === "create" ? "/api/admin/providers" : `/api/admin/providers/${provider!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не удалось сохранить провайдера");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Новый провайдер" : "Редактирование провайдера"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Добавьте провайдера для группировки тарифов на сайте и в админке"
              : `ID: ${provider?.id}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="provider-id">ID провайдера</FieldLabel>
                <FieldDescription>Например: codex, cursor, windsurf</FieldDescription>
                <Input
                  id="provider-id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="windsurf"
                  pattern="[a-z0-9][a-z0-9_-]{1,31}"
                  required
                  disabled={loading}
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="provider-label">Название</FieldLabel>
              <Input
                id="provider-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Windsurf"
                required
                disabled={loading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="provider-description">Описание</FieldLabel>
              <Textarea
                id="provider-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="provider-sort-order">Порядок сортировки</FieldLabel>
              <Input
                id="provider-sort-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={loading}
              />
            </Field>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <span className="text-sm font-medium">Активен на сайте</span>
              <Switch checked={active} onCheckedChange={setActive} disabled={loading} />
            </label>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-1" />}
              {loading ? "Сохранение…" : mode === "create" ? "Создать" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
