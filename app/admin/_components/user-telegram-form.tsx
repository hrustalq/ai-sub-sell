"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

type UserTelegramFormProps = {
  apiUrl: string;
  initialTelegramUserId: string | null;
  canEdit: boolean;
  title?: string;
};

export function UserTelegramForm({
  apiUrl,
  initialTelegramUserId,
  canEdit,
  title = "Telegram ID",
}: UserTelegramFormProps) {
  const router = useRouter();
  const [telegramUserId, setTelegramUserId] = useState(initialTelegramUserId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dirty = telegramUserId.trim() !== (initialTelegramUserId ?? "").trim();
  const hasLinkedId = Boolean(initialTelegramUserId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId: telegramUserId.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не удалось сохранить Telegram ID");
      }

      setSuccess("Telegram ID сохранён. Отправьте /start боту поддержки, если ещё не делали этого.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!canEdit || !hasLinkedId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId: null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не удалось отвязать Telegram ID");
      }

      setTelegramUserId("");
      setSuccess("Telegram ID отвязан.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="telegram-user-id">{title}</FieldLabel>
          <FieldDescription>
            Узнайте ID через @userinfobot, отправьте /start боту поддержки, затем введите
            числовой ID здесь.
          </FieldDescription>
          <Input
            id="telegram-user-id"
            inputMode="numeric"
            pattern="\d*"
            placeholder="123456789"
            value={telegramUserId}
            onChange={(event) => setTelegramUserId(event.target.value.replace(/\D/g, ""))}
            disabled={!canEdit || loading}
            className="mt-2 font-mono"
          />
        </Field>

        {error && <FieldError>{error}</FieldError>}
        {success && <p className="text-sm text-primary">{success}</p>}

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || !dirty}>
              {loading && <Spinner />}
              Сохранить
            </Button>
            {hasLinkedId && (
              <Button type="button" variant="outline" disabled={loading} onClick={handleClear}>
                Отвязать
              </Button>
            )}
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
