"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import type { Plan, PricingProviderGroup, ProviderMeta } from "@/lib/plans/client";
import {
  groupPlansByProvider,
  getDiscountPercent,
  formatPrice,
} from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function formatDurationLabel(months: number) {
  if (months === 0) return "1 нед";
  if (months === 1) return "1 мес";
  return `${months} мес`;
}

function DurationSelector({
  options,
  selectedId,
  onSelect,
}: {
  options: PricingProviderGroup["tiers"][number]["options"];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const count = options.length;
  const showDiscountRow = options.some((option) => {
    const d = getDiscountPercent(option);
    return d !== null && d > 0;
  });

  return (
    <div
      className={cn(
        "flex gap-1 rounded-lg bg-muted p-1 mx-auto",
        count === 1 ? "w-fit self-start" : "w-full",
      )}
      role="radiogroup"
      aria-label="Срок подписки"
    >
      {options.map((option) => {
        const optionDiscount = getDiscountPercent(option);
        const hasDiscount = optionDiscount !== null && optionDiscount > 0;
        const isSelected = selectedId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-md text-center transition-colors",
              showDiscountRow ? "min-h-11 gap-0.5 py-1.5" : "min-h-9 py-2",
              count === 1 ? "min-w-22 px-4" : "min-w-0 flex-1 px-2",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-xs font-medium leading-none">
              {formatDurationLabel(option.durationMonths)}
            </span>
            {showDiscountRow && hasDiscount && (
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isSelected ? "text-primary" : "text-muted-foreground",
                )}
              >
                −{optionDiscount}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TierCard({
  tier,
  maxLimits,
}: {
  tier: PricingProviderGroup["tiers"][number];
  maxLimits: number;
}) {
  const defaultOption =
    tier.options.find((p) => p.highlight) ??
    tier.options.find((p) => p.durationMonths === 3) ??
    tier.options[0]!;

  const [selectedId, setSelectedId] = useState(defaultOption.id);
  const selected =
    tier.options.find((p) => p.id === selectedId) ?? defaultOption;
  const discount = getDiscountPercent(selected);
  const showCompare =
    selected.compareAtPrice !== null &&
    selected.compareAtPrice > selected.price;

  return (
    <div className="relative flex h-full flex-col pt-3">
      {selected.badge && (
        <Badge className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 px-3 shadow-sm">
          {selected.badge}
        </Badge>
      )}
      <Card
        className={cn(
          "flex h-full flex-1 flex-col",
          tier.highlight && "border-2 border-primary shadow-xs",
        )}
      >
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold leading-snug text-card-foreground">
              {tier.label}
            </span>
            {tier.tag && (
              <Badge variant="outline" className="shrink-0 text-xs">
                {tier.tag}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <DurationSelector
            options={tier.options}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="flex min-h-14 flex-col justify-end gap-0.5">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(selected.price, selected.currency)}
              </span>
              <span className="mb-1 text-sm text-muted-foreground">
                / {selected.period}
              </span>
            </div>
            <div className="flex min-h-5 items-center gap-2 text-sm">
              {showCompare ? (
                <>
                  <span className="text-muted-foreground line-through">
                    {formatPrice(selected.compareAtPrice!, selected.currency)}
                  </span>
                  {discount !== null && discount > 0 && (
                    <span className="text-xs font-medium text-primary">
                      −{discount}%
                    </span>
                  )}
                </>
              ) : (
                <span className="invisible text-xs" aria-hidden>
                  —
                </span>
              )}
            </div>
          </div>

          <ul
            className="flex flex-1 flex-col gap-1.5"
            style={{ minHeight: `${maxLimits * 1.625}rem` }}
          >
            {tier.limits.map((limit) => (
              <li
                key={limit}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <CheckIcon className="size-4 shrink-0 text-primary" />
                {limit}
              </li>
            ))}
          </ul>

          <Button
            asChild
            className="mt-auto w-full"
            variant={tier.highlight ? "default" : "outline"}
          >
            <Link href={`/checkout/${selected.id}`}>Купить</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function PricingSection({
  plans,
  providers,
}: {
  plans: Plan[];
  providers: ProviderMeta[];
}) {
  const catalog = useMemo(() => groupPlansByProvider(plans, providers), [plans, providers]);
  const defaultProvider = catalog[0]?.id ?? "codex";

  if (catalog.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Тарифы скоро появятся.
      </p>
    );
  }

  return (
    <Tabs defaultValue={defaultProvider} className="w-full gap-8">
      <TabsList className="mx-auto flex h-auto w-full max-w-2xl flex-wrap justify-center gap-1 p-1">
        {catalog.map((provider) => (
          <TabsTrigger key={provider.id} value={provider.id} className="px-4">
            {provider.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {catalog.map((provider) => (
        <TabsContent
          key={provider.id}
          value={provider.id}
          className="flex flex-col gap-8"
        >
          <p className="text-center text-muted-foreground">
            {provider.description}
          </p>
          <div
            className={cn(
              "grid grid-cols-1 items-stretch gap-6",
              provider.tiers.length >= 3
                ? "md:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {provider.tiers.map((tier) => (
              <TierCard
                key={`${provider.id}-${tier.id}`}
                tier={tier}
                maxLimits={Math.max(
                  ...provider.tiers.map((t) => t.limits.length),
                  1,
                )}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
