"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Plan } from "@/lib/plans/client";
import { PROVIDERS, DURATION_OPTIONS, formatDurationPeriod } from "@/lib/plans/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

type PlanFormProps = {
  mode: "create" | "edit";
  plan?: Plan;
};

const DURATION_CHOICES = [
  { months: 0, label: "1 неделя" },
  ...DURATION_OPTIONS.map((d) => ({ months: d.months, label: d.label })),
];

export function PlanForm({ mode, plan }: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [id, setId] = useState(plan?.id ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [provider, setProvider] = useState(plan?.provider ?? "codex");
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
  const [sortOrder, setSortOrder] = useState(plan ? String(plan.sortOrder) : "0");

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

    const url = mode === "create" ? "/api/admin/plans" : `/api/admin/plans/${plan!.id}`;
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

      router.push("/admin/plans");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Новый тариф" : "Редактирование тарифа"}</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Группировка: провайдер → опция → срок"
            : `ID: ${plan?.id}`}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="id">ID тарифа</FieldLabel>
                <FieldDescription>
                  Например: codex-pro-12m, cursor-standard-3m
                </FieldDescription>
                <Input
                  id="id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="codex-pro-12m"
                  pattern="[a-z0-9][a-z0-9_-]{1,48}"
                  required
                  disabled={loading}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Провайдер</FieldLabel>
                <Select value={provider} onValueChange={setProvider} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Провайдер" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="tier">Код опции (tier)</FieldLabel>
                <Input
                  id="tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  placeholder="standard"
                  required
                  disabled={loading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="tierLabel">Название опции</FieldLabel>
              <Input
                id="tierLabel"
                value={tierLabel}
                onChange={(e) => setTierLabel(e.target.value)}
                placeholder="Стандарт"
                required
                disabled={loading}
              />
            </Field>

            <Field>
              <FieldLabel>Срок</FieldLabel>
              <Select
                value={durationMonths}
                onValueChange={setDurationMonths}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
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
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Полное название</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Codex — Про (6 месяцев)"
                required
                disabled={loading}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="price">Цена</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="compareAtPrice">Цена без скидки</FieldLabel>
                <FieldDescription>Для отображения зачёркнутой цены</FieldDescription>
                <Input
                  id="compareAtPrice"
                  type="number"
                  min={1}
                  step={1}
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="currency">Валюта</FieldLabel>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="RUB"
                  required
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="period">Период (отображение)</FieldLabel>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="6 месяцев"
                  disabled={loading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="limits">Лимиты</FieldLabel>
              <FieldDescription>По одному пункту на строку</FieldDescription>
              <Textarea
                id="limits"
                value={limits}
                onChange={(e) => setLimits(e.target.value)}
                rows={5}
                required
                disabled={loading}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="tag">Метка</FieldLabel>
                <Input
                  id="tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={loading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="badge">Бейдж</FieldLabel>
                <Input
                  id="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  disabled={loading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="sortOrder">Порядок сортировки</FieldLabel>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={loading}
              />
            </Field>

            <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Выделить на главной</span>
                <Switch checked={highlight} onCheckedChange={setHighlight} disabled={loading} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Активен</span>
                <Switch checked={active} onCheckedChange={setActive} disabled={loading} />
              </label>
            </div>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/admin/plans">Отмена</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner className="mr-1" />}
            {loading ? "Сохранение…" : mode === "create" ? "Создать тариф" : "Сохранить"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
