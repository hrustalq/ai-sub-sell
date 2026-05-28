"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { AdminCounterpartyDetailRecord } from "@/lib/admin/types";
import { routes } from "@/lib/routes";
import { formatPrice } from "@/lib/plans/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { DeleteCounterpartyButton } from "@/app/admin/_components/delete-counterparty-button";
import { cn } from "@/lib/utils";

type CounterpartyFormProps = {
  mode: "create" | "edit";
  counterparty?: AdminCounterpartyDetailRecord;
};

type PricingOptionDraft = {
  clientKey: string;
  id?: string;
  label: string;
  price: string;
  currency: string;
  notes: string;
  sortOrder: string;
  active: boolean;
};

const controlClass =
  "h-9 border-0 bg-muted/50 shadow-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-muted/30";

function createPricingOptionDraft(
  option?: AdminCounterpartyDetailRecord["pricingOptions"][number],
  index = 0,
): PricingOptionDraft {
  return {
    clientKey: option?.id ?? crypto.randomUUID(),
    id: option?.id,
    label: option?.label ?? "",
    price: option != null ? String(option.price) : "",
    currency: option?.currency ?? "CNY",
    notes: option?.notes ?? "",
    sortOrder: option != null ? String(option.sortOrder) : String(index),
    active: option?.active !== false,
  };
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 border-b border-border/50 py-4 last:border-b-0 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-10 md:py-5 lg:grid-cols-[8.5rem_minmax(0,1fr)]">
      <div className="md:pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function FormGrid({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {hint ? (
        <p className="-mt-1 text-[11px] leading-tight text-muted-foreground/80">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

export function CounterpartyForm({ mode, counterparty }: CounterpartyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(counterparty?.name ?? "");
  const [notes, setNotes] = useState(counterparty?.notes ?? "");
  const [contactName, setContactName] = useState(counterparty?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(counterparty?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(counterparty?.contactPhone ?? "");
  const [wechatId, setWechatId] = useState(counterparty?.wechatId ?? "");
  const [shopUrl, setShopUrl] = useState(counterparty?.shopUrl ?? "");
  const [active, setActive] = useState(counterparty?.active ?? true);
  const [sortOrder, setSortOrder] = useState(
    counterparty != null ? String(counterparty.sortOrder) : "0",
  );
  const [pricingOptions, setPricingOptions] = useState<PricingOptionDraft[]>(() =>
    counterparty?.pricingOptions.length
      ? counterparty.pricingOptions.map((option, index) => createPricingOptionDraft(option, index))
      : [createPricingOptionDraft(undefined, 0)],
  );

  function updatePricingOption(
    clientKey: string,
    patch: Partial<PricingOptionDraft>,
  ) {
    setPricingOptions((current) =>
      current.map((option) =>
        option.clientKey === clientKey ? { ...option, ...patch } : option,
      ),
    );
  }

  function addPricingOption() {
    setPricingOptions((current) => [
      ...current,
      createPricingOptionDraft(undefined, current.length),
    ]);
  }

  function removePricingOption(clientKey: string) {
    setPricingOptions((current) =>
      current.length <= 1 ? current : current.filter((option) => option.clientKey !== clientKey),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      notes: notes.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      wechatId: wechatId.trim(),
      shopUrl: shopUrl.trim(),
      active,
      sortOrder: Number(sortOrder),
      pricingOptions: pricingOptions.map((option, index) => ({
        ...(option.id ? { id: option.id } : {}),
        label: option.label.trim(),
        price: Number(option.price),
        currency: option.currency.trim() || "CNY",
        notes: option.notes.trim(),
        sortOrder: option.sortOrder.trim() ? Number(option.sortOrder) : index,
        active: option.active,
      })),
    };

    const url =
      mode === "create"
        ? "/api/admin/counterparties"
        : `/api/admin/counterparties/${counterparty!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не удалось сохранить контрагента");
      }

      router.push(routes.admin.counterparties);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="shrink-0 gap-1 border-b border-border px-5 py-4 md:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          {mode === "create" ? "Новый контрагент" : "Редактирование"}
        </p>
        <CardTitle className="text-xl leading-tight">
          {mode === "create" ? "Создание контрагента" : counterparty?.name}
        </CardTitle>
        <CardDescription className="text-xs">
          {mode === "create"
            ? "Поставщик аккаунтов для подписок: контакты, WeChat, магазин и закупочные цены"
            : `ID: ${counterparty?.id}`}
        </CardDescription>
      </CardHeader>

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <CardContent className="min-h-0 flex-1 overflow-y-auto px-5 md:px-8">
          <div className="mx-auto w-full">
            <FormSection title="Основное">
              <FormField label="Название" htmlFor="name">
                <Input
                  id="name"
                  className={controlClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Taobao Shop — AI accounts"
                  required
                  disabled={loading}
                />
              </FormField>
              <FormField label="Заметки" htmlFor="notes" hint="Внутренние комментарии для команды">
                <Textarea
                  id="notes"
                  className={cn(controlClass, "min-h-20 resize-y py-2")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={loading}
                />
              </FormField>
            </FormSection>

            <FormSection title="Контакты">
              <FormGrid cols={3}>
                <FormField label="Контактное лицо" htmlFor="contactName">
                  <Input
                    id="contactName"
                    className={controlClass}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={loading}
                  />
                </FormField>
                <FormField label="Email" htmlFor="contactEmail">
                  <Input
                    id="contactEmail"
                    type="email"
                    className={controlClass}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={loading}
                  />
                </FormField>
                <FormField label="Телефон" htmlFor="contactPhone">
                  <Input
                    id="contactPhone"
                    className={controlClass}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={loading}
                  />
                </FormField>
              </FormGrid>
              <FormGrid>
                <FormField label="WeChat ID" htmlFor="wechatId" hint="Логин или ID в WeChat">
                  <Input
                    id="wechatId"
                    className={controlClass}
                    value={wechatId}
                    onChange={(e) => setWechatId(e.target.value)}
                    placeholder="wxid_..."
                    disabled={loading}
                  />
                </FormField>
                <FormField
                  label="Страница магазина"
                  htmlFor="shopUrl"
                  hint="Ссылка на Taobao, 1688 или другой китайский магазин"
                >
                  <Input
                    id="shopUrl"
                    type="url"
                    className={controlClass}
                    value={shopUrl}
                    onChange={(e) => setShopUrl(e.target.value)}
                    placeholder="https://"
                    disabled={loading}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection title="Цены">
              <div className="grid gap-3">
                {pricingOptions.map((option, index) => (
                  <div
                    key={option.clientKey}
                    className="rounded-xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Позиция {index + 1}</p>
                      <div className="flex items-center gap-2">
                        {option.price && option.currency ? (
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(Number(option.price), option.currency)}
                          </span>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removePricingOption(option.clientKey)}
                          disabled={loading || pricingOptions.length <= 1}
                          aria-label="Удалить позицию"
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <FormGrid cols={3}>
                      <FormField label="Название" htmlFor={`option-label-${option.clientKey}`}>
                        <Input
                          id={`option-label-${option.clientKey}`}
                          className={controlClass}
                          value={option.label}
                          onChange={(e) =>
                            updatePricingOption(option.clientKey, { label: e.target.value })
                          }
                          placeholder="ChatGPT Plus — 1 месяц"
                          required
                          disabled={loading}
                        />
                      </FormField>
                      <FormField label="Цена" htmlFor={`option-price-${option.clientKey}`}>
                        <Input
                          id={`option-price-${option.clientKey}`}
                          type="number"
                          min={0}
                          step={0.01}
                          className={controlClass}
                          value={option.price}
                          onChange={(e) =>
                            updatePricingOption(option.clientKey, { price: e.target.value })
                          }
                          required
                          disabled={loading}
                        />
                      </FormField>
                      <FormField label="Валюта" htmlFor={`option-currency-${option.clientKey}`}>
                        <Input
                          id={`option-currency-${option.clientKey}`}
                          className={controlClass}
                          value={option.currency}
                          onChange={(e) =>
                            updatePricingOption(option.clientKey, { currency: e.target.value })
                          }
                          placeholder="CNY"
                          required
                          disabled={loading}
                        />
                      </FormField>
                    </FormGrid>
                    <FormGrid className="mt-3">
                      <FormField label="Заметки" htmlFor={`option-notes-${option.clientKey}`}>
                        <Input
                          id={`option-notes-${option.clientKey}`}
                          className={controlClass}
                          value={option.notes}
                          onChange={(e) =>
                            updatePricingOption(option.clientKey, { notes: e.target.value })
                          }
                          placeholder="Условия, срок поставки, ограничения"
                          disabled={loading}
                        />
                      </FormField>
                      <FormField label="Порядок" htmlFor={`option-sort-${option.clientKey}`}>
                        <Input
                          id={`option-sort-${option.clientKey}`}
                          type="number"
                          className={controlClass}
                          value={option.sortOrder}
                          onChange={(e) =>
                            updatePricingOption(option.clientKey, { sortOrder: e.target.value })
                          }
                          disabled={loading}
                        />
                      </FormField>
                    </FormGrid>
                    <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
                      <Switch
                        checked={option.active}
                        onCheckedChange={(checked) =>
                          updatePricingOption(option.clientKey, { active: checked })
                        }
                        disabled={loading}
                      />
                      <span>Активна</span>
                    </label>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPricingOption} disabled={loading}>
                  <PlusIcon className="mr-1 size-4" />
                  Добавить цену
                </Button>
              </div>
            </FormSection>

            <FormSection title="Настройки">
              <FormGrid className="items-center">
                <FormField label="Порядок сортировки" htmlFor="sortOrder">
                  <Input
                    id="sortOrder"
                    className={controlClass}
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    disabled={loading}
                  />
                </FormField>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-1">
                  <Switch checked={active} onCheckedChange={setActive} disabled={loading} />
                  <span>Активен</span>
                </label>
              </FormGrid>
            </FormSection>

            {error && (
              <div className="pt-2">
                <FieldError>{error}</FieldError>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="shrink-0 border-t border-border bg-background px-5 py-4 md:px-8 [.border-t]:pt-4">
          <div className="mx-auto grid w-full grid-cols-1 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-10 lg:grid-cols-[8.5rem_minmax(0,1fr)]">
            <div className="hidden md:block" aria-hidden />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
              {mode === "edit" && counterparty ? (
                <DeleteCounterpartyButton
                  counterpartyId={counterparty.id}
                  counterpartyName={counterparty.name}
                />
              ) : (
                <div />
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 w-full px-6 sm:w-auto sm:min-w-38"
                  asChild
                  disabled={loading}
                >
                  <Link href={routes.admin.counterparties}>Отмена</Link>
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full px-6 sm:w-auto sm:min-w-38"
                  disabled={loading}
                >
                  {loading && <Spinner className="mr-1" />}
                  {loading
                    ? "Сохранение…"
                    : mode === "create"
                      ? "Создать контрагента"
                      : "Сохранить"}
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
