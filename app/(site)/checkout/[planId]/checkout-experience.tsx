"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import type { Plan } from "@/lib/plans/client";
import {
  formatPrice,
  getDiscountPercent,
  getDurationLabel,
  getDurationOptions,
  getProviderLabel,
  getProviderPlans,
  getUpgradePlans,
  pickPlanForDuration,
} from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckoutForm } from "./checkout-form";

type CheckoutExperienceProps = {
  initialPlan: Plan;
  catalogPlans: Plan[];
  userEmail: string;
};

function PlanOptionCard({
  id,
  selected,
  title,
  subtitle,
  price,
  compareAtPrice,
  currency,
  badge,
}: {
  id: string;
  selected: boolean;
  title: string;
  subtitle?: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  badge?: string | null;
}) {
  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round((1 - price / compareAtPrice) * 100)
      : null;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <RadioGroupItem value={id} id={id} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          {discount !== null && discount > 0 && (
            <Badge className="text-xs">−{discount}%</Badge>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <p className="text-sm font-semibold text-foreground">
          {formatPrice(price, currency)}
          {compareAtPrice && compareAtPrice > price && (
            <span className="ml-2 font-normal text-muted-foreground line-through">
              {formatPrice(compareAtPrice, currency)}
            </span>
          )}
        </p>
      </div>
    </label>
  );
}

export function CheckoutExperience({
  initialPlan,
  catalogPlans,
  userEmail,
}: CheckoutExperienceProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialPlan.id);

  const providerPlans = useMemo(
    () => getProviderPlans(catalogPlans, initialPlan.provider),
    [catalogPlans, initialPlan.provider],
  );

  const selected =
    providerPlans.find((p) => p.id === selectedId) ??
    providerPlans.find((p) => p.id === initialPlan.id) ??
    initialPlan;

  const durationOptions = useMemo(
    () => getDurationOptions(providerPlans, selected.tier),
    [providerPlans, selected.tier],
  );

  const upgradePlans = useMemo(
    () => getUpgradePlans(providerPlans, selected.tier, selected.durationMonths),
    [providerPlans, selected.tier, selected.durationMonths],
  );

  const discount = getDiscountPercent(selected);

  const selectedDurationPlan =
    durationOptions.find((p) => p.id === selected.id) ??
    durationOptions.find((p) => p.durationMonths === selected.durationMonths) ??
    durationOptions[0];

  function formatDurationOptionLabel(option: Plan): string {
    const label = getDurationLabel(option.durationMonths);
    const optionDiscount = getDiscountPercent(option);
    const price = formatPrice(option.price, option.currency);
    if (optionDiscount !== null && optionDiscount > 0) {
      return `${label} (−${optionDiscount}%) · ${price}`;
    }
    return `${label} · ${price}`;
  }

  function selectPlan(plan: Plan) {
    setSelectedId(plan.id);
    router.replace(`/checkout/${plan.id}`, { scroll: false });
  }

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] lg:grid-cols-2">
      {/* Order summary — Stripe-style dark panel */}
      <aside className="relative flex flex-col bg-zinc-950 px-6 py-10 text-zinc-50 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Link
            href="/#pricing"
            className="mb-10 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            ← Назад к тарифам
          </Link>

          <div className="flex flex-1 flex-col justify-center gap-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                {getProviderLabel(selected.provider)}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {selected.tierLabel}
              </h1>
              <p className="mt-1 text-zinc-400">{selected.period}</p>
            </div>

            <div>
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-4xl font-bold tabular-nums sm:text-5xl">
                  {formatPrice(selected.price, selected.currency)}
                </span>
                {selected.compareAtPrice && selected.compareAtPrice > selected.price && (
                  <span className="mb-1 text-lg text-zinc-500 line-through">
                    {formatPrice(selected.compareAtPrice, selected.currency)}
                  </span>
                )}
              </div>
              {discount !== null && discount > 0 && (
                <p className="mt-2 text-sm text-emerald-400">Экономия {discount}%</p>
              )}
            </div>

            <ul className="flex flex-col gap-2.5">
              {selected.limits.map((limit) => (
                <li key={limit} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <CheckIcon className="size-4 shrink-0 text-emerald-400" />
                  {limit}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 border-t border-zinc-800 pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">К оплате</span>
              <span className="text-xl font-semibold tabular-nums">
                {formatPrice(selected.price, selected.currency)}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Налоги и комиссии включены в стоимость
            </p>
          </div>
        </div>
      </aside>

      {/* Payment panel */}
      <section className="flex flex-col bg-muted/40 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Детали заказа</CardTitle>
              <CardDescription>Выберите срок и тариф перед оплатой</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="rounded-md border bg-muted/50 px-3 py-2.5 text-sm font-medium">
                  {userEmail}
                </p>
              </div>

              {durationOptions.length > 1 && selectedDurationPlan && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="duration-select">Срок подписки</Label>
                  <Select
                    value={selectedDurationPlan.id}
                    onValueChange={(id) => {
                      const plan = durationOptions.find((p) => p.id === id);
                      if (plan) selectPlan(plan);
                    }}
                  >
                    <SelectTrigger id="duration-select" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {formatDurationOptionLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {upgradePlans.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="size-4 text-primary" />
                    <Label>Более выгодный тариф</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Больше лимитов за тот же срок — {getDurationLabel(selected.durationMonths)}
                  </p>
                  <RadioGroup
                    value={upgradePlans.some((p) => p.id === selected.id) ? selected.id : ""}
                    onValueChange={(id) => {
                      const plan = upgradePlans.find((p) => p.id === id);
                      if (plan) selectPlan(plan);
                    }}
                    className="gap-2"
                  >
                    {upgradePlans.map((plan) => (
                      <PlanOptionCard
                        key={plan.id}
                        id={plan.id}
                        selected={selected.id === plan.id}
                        title={plan.tierLabel}
                        subtitle={plan.limits[0]}
                        price={plan.price}
                        compareAtPrice={plan.compareAtPrice}
                        currency={plan.currency}
                        badge={plan.badge}
                      />
                    ))}
                  </RadioGroup>
                  {upgradePlans.some((p) => p.id === selected.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        const base = pickPlanForDuration(
                          getDurationOptions(providerPlans, initialPlan.tier),
                          selected.durationMonths,
                        );
                        if (base) selectPlan(base);
                      }}
                      className="text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Оставить «{initialPlan.tierLabel}»
                    </button>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t">
              <CheckoutForm
                planId={selected.id}
                priceLabel={formatPrice(selected.price, selected.currency)}
              />
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheckIcon className="size-4 text-primary" />
                Безопасная оплата через YooKassa
              </div>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
