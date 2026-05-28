"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Plan, ProviderMeta } from "@/lib/plans/client";
import { routes } from "@/lib/routes";
import { DURATION_OPTIONS, formatDurationPeriod } from "@/lib/plans/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

type PlanFormProps = {
  mode: "create" | "edit";
  plan?: Plan;
  providers: ProviderMeta[];
};

const DURATION_CHOICES = [
  { months: 0, label: "1 неделя" },
  ...DURATION_OPTIONS.map((d) => ({ months: d.months, label: d.label })),
];

const controlClass =
  "h-9 border-0 bg-muted/50 shadow-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-muted/30";

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
      <Label
        htmlFor={htmlFor}
        className="text-xs font-normal text-muted-foreground"
      >
        {label}
      </Label>
      {hint ? (
        <p className="-mt-1 text-[11px] leading-tight text-muted-foreground/80">
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function PlanForm({ mode, plan, providers }: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultProvider =
    plan?.provider ??
    providers.find((provider) => provider.active !== false)?.id ??
    providers[0]?.id ??
    "";

  const [id, setId] = useState(plan?.id ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [provider, setProvider] = useState(defaultProvider);
  const [tier, setTier] = useState(plan?.tier ?? "standard");
  const [tierLabel, setTierLabel] = useState(plan?.tierLabel ?? "Стандарт");
  const [durationMonths, setDurationMonths] = useState(
    plan ? String(plan.durationMonths) : "1",
  );
  const [price, setPrice] = useState(plan ? String(plan.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    plan?.compareAtPrice ? String(plan.compareAtPrice) : "",
  );
  const [currency, setCurrency] = useState(plan?.currency ?? "RUB");
  const [period, setPeriod] = useState(plan?.period ?? "");
  const [limits, setLimits] = useState(plan?.limits.join("\n") ?? "");
  const [tag, setTag] = useState(plan?.tag ?? "");
  const [badge, setBadge] = useState(plan?.badge ?? "");
  const [highlight, setHighlight] = useState(plan?.highlight ?? false);
  const [active, setActive] = useState(plan?.active ?? true);
  const [sortOrder, setSortOrder] = useState(
    plan ? String(plan.sortOrder) : "0",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const months = Number(durationMonths);
    const payload = {
      ...(mode === "create" ? { id: id.trim().toLowerCase() } : {}),
      name: name.trim(),
      provider,
      tier: tier.trim().toLowerCase(),
      tierLabel: tierLabel.trim(),
      durationMonths: months,
      price: Number(price),
      compareAtPrice: compareAtPrice.trim() ? Number(compareAtPrice) : null,
      currency: currency.trim() || "RUB",
      period: period.trim() || formatDurationPeriod(months),
      limits,
      tag: tag.trim() || null,
      badge: badge.trim() || null,
      highlight,
      active,
      sortOrder: Number(sortOrder),
    };

    const url =
      mode === "create" ? "/api/admin/plans" : `/api/admin/plans/${plan!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не удалось сохранить тариф");
      }

      router.push(routes.admin.plans);
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
          {mode === "create" ? "Новый тариф" : "Редактирование"}
        </p>
        <CardTitle className="text-xl leading-tight">
          {mode === "create" ? "Создание тарифа" : (plan?.tierLabel ?? "Тариф")}
        </CardTitle>
        <CardDescription className="text-xs">
          {mode === "create"
            ? "Группировка: провайдер → опция → срок"
            : `ID: ${plan?.id}`}
        </CardDescription>
      </CardHeader>

      {providers.length === 0 ? (
        <CardContent className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-8">
          <p className="text-sm text-muted-foreground">
            Сначала добавьте провайдера на странице тарифов.
          </p>
        </CardContent>
      ) : (
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <CardContent className="min-h-0 flex-1 overflow-y-auto px-5 md:px-8">
            <div className="mx-auto w-full">
              {mode === "create" && (
                <FormSection title="ID">
                  <FormField
                    label="ID тарифа"
                    htmlFor="id"
                    hint="codex-pro-12m, cursor-standard-3m"
                  >
                    <Input
                      id="id"
                      className={controlClass}
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder="codex-pro-12m"
                      pattern="[a-z0-9][a-z0-9_-]{1,48}"
                      required
                      disabled={loading}
                    />
                  </FormField>
                </FormSection>
              )}

              <FormSection title="Основное">
                <FormGrid cols={3}>
                  <FormField label="Провайдер" htmlFor="provider">
                    <Select
                      value={provider}
                      onValueChange={setProvider}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="provider"
                        className={cn("w-full", controlClass)}
                      >
                        <SelectValue placeholder="Провайдер" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Код опции" htmlFor="tier">
                    <Input
                      id="tier"
                      className={controlClass}
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      placeholder="standard"
                      required
                      disabled={loading}
                    />
                  </FormField>
                  <FormField label="Срок" htmlFor="duration">
                    <Select
                      value={durationMonths}
                      onValueChange={setDurationMonths}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="duration"
                        className={cn("w-full", controlClass)}
                      >
                        <SelectValue placeholder="Срок" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_CHOICES.map((d) => (
                          <SelectItem key={d.months} value={String(d.months)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </FormGrid>

                <FormGrid>
                  <FormField label="Название опции" htmlFor="tierLabel">
                    <Input
                      id="tierLabel"
                      className={controlClass}
                      value={tierLabel}
                      onChange={(e) => setTierLabel(e.target.value)}
                      placeholder="Стандарт"
                      required
                      disabled={loading}
                    />
                  </FormField>
                  <FormField label="Полное название" htmlFor="name">
                    <Input
                      id="name"
                      className={controlClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Codex — Про (6 месяцев)"
                      required
                      disabled={loading}
                    />
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Цена">
                <FormGrid cols={3}>
                  <FormField label="Цена" htmlFor="price">
                    <Input
                      id="price"
                      className={controlClass}
                      type="number"
                      min={1}
                      step={1}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </FormField>
                  <FormField label="Без скидки" htmlFor="compareAtPrice">
                    <Input
                      id="compareAtPrice"
                      className={controlClass}
                      type="number"
                      min={1}
                      step={1}
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      disabled={loading}
                    />
                  </FormField>
                  <FormField label="Валюта" htmlFor="currency">
                    <Input
                      id="currency"
                      className={controlClass}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="RUB"
                      required
                      disabled={loading}
                    />
                  </FormField>
                </FormGrid>
                <FormField
                  label="Период (отображение)"
                  htmlFor="period"
                  className="sm:max-w-xs"
                >
                  <Input
                    id="period"
                    className={controlClass}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="6 месяцев"
                    disabled={loading}
                  />
                </FormField>
              </FormSection>

              <FormSection title="Контент">
                <FormField
                  label="Лимиты"
                  htmlFor="limits"
                  hint="По одному пункту на строку"
                >
                  <Textarea
                    id="limits"
                    className={cn(controlClass, "min-h-20 resize-y py-2")}
                    value={limits}
                    onChange={(e) => setLimits(e.target.value)}
                    rows={3}
                    required
                    disabled={loading}
                  />
                </FormField>
                <FormGrid>
                  <FormField label="Метка" htmlFor="tag">
                    <Input
                      id="tag"
                      className={controlClass}
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      disabled={loading}
                    />
                  </FormField>
                  <FormField label="Бейдж" htmlFor="badge">
                    <Input
                      id="badge"
                      className={controlClass}
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      disabled={loading}
                    />
                  </FormField>
                </FormGrid>
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
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-1">
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <Switch
                        checked={highlight}
                        onCheckedChange={setHighlight}
                        disabled={loading}
                      />
                      <span>Выделить на главной</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <Switch
                        checked={active}
                        onCheckedChange={setActive}
                        disabled={loading}
                      />
                      <span>Активен</span>
                    </label>
                  </div>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 w-full px-6 sm:w-auto sm:min-w-38"
                  asChild
                  disabled={loading}
                >
                  <Link href={routes.admin.plans}>Отмена</Link>
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
                      ? "Создать тариф"
                      : "Сохранить"}
                </Button>
              </div>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
