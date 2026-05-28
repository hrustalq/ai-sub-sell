"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

type UserRbacFormProps = {
  userId: string;
  initialRbacAdmin: boolean;
  initialRbacSupport: boolean;
};

export function UserRbacForm({
  userId,
  initialRbacAdmin,
  initialRbacSupport,
}: UserRbacFormProps) {
  const router = useRouter();
  const [rbacAdmin, setRbacAdmin] = useState(initialRbacAdmin);
  const [rbacSupport, setRbacSupport] = useState(initialRbacSupport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = rbacAdmin !== initialRbacAdmin || rbacSupport !== initialRbacSupport;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/rbac`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rbacAdmin, rbacSupport }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не удалось сохранить права доступа");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-5">
        <Field>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <FieldLabel htmlFor="rbac-admin">Администратор</FieldLabel>
              <FieldDescription>
                Доступ к обзору, тарифам, пользователям и платежам.
              </FieldDescription>
            </div>
            <Switch
              id="rbac-admin"
              checked={rbacAdmin}
              onCheckedChange={setRbacAdmin}
              disabled={loading}
            />
          </div>
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <FieldLabel htmlFor="rbac-support">Поддержка</FieldLabel>
              <FieldDescription>
                Доступ к заказам, переписке с покупателями и выдаче товара.
              </FieldDescription>
            </div>
            <Switch
              id="rbac-support"
              checked={rbacSupport}
              onCheckedChange={setRbacSupport}
              disabled={loading}
            />
          </div>
        </Field>

        {error && <FieldError>{error}</FieldError>}

        <Button type="submit" disabled={loading || !dirty}>
          {loading && <Spinner />}
          Сохранить права
        </Button>
      </FieldGroup>
    </form>
  );
}
