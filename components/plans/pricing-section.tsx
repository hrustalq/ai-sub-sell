"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import type { PricingProviderGroup } from "@/lib/plans/client";
import { getDiscountPercent } from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedPrice } from "@/components/plans/animated-price";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";

const TAB_SELECT_TRANSITION = {
  type: "spring" as const,
  visualDuration: 0.22,
  bounce: 0.1,
};

const PROVIDER_TAB_LAYOUT_ID = "pricing-provider-tab";

function isPromotionalBadge(badge: string | null | undefined): badge is string {
  return Boolean(badge && !badge.startsWith("−"));
}

function formatDiscountLabel(discount: number) {
  return `−${discount}%`;
}

function formatDurationLabel(months: number) {
  if (months === 0) return "1 нед";
  if (months === 1) return "1 мес";
  return `${months} мес`;
}

function DurationSelector({
  options,
  selectedId,
  onSelect,
  layoutId,
}: {
  options: PricingProviderGroup["tiers"][number]["options"];
  selectedId: string;
  onSelect: (id: string) => void;
  layoutId: string;
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
          <motion.button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.id)}
            whileTap={{ scale: 0.97 }}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "relative z-10 flex flex-col items-center justify-center rounded-md text-center outline-none",
              showDiscountRow ? "min-h-11 gap-0.5 py-1.5" : "min-h-9 py-2",
              count === 1 ? "min-w-22 px-4" : "min-w-0 flex-1 px-2",
              isSelected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isSelected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-background shadow-sm"
                style={{ borderRadius: 6 }}
                transition={TAB_SELECT_TRANSITION}
              />
            )}
            <span className="relative z-10 text-xs font-medium leading-none">
              {formatDurationLabel(option.durationMonths)}
            </span>
            {showDiscountRow && (
              <span
                className={cn(
                  "relative z-10 text-[10px] font-medium leading-none",
                  hasDiscount
                    ? isSelected
                      ? "text-primary"
                      : "text-muted-foreground"
                    : "invisible",
                )}
                aria-hidden={!hasDiscount}
              >
                {hasDiscount ? `−${optionDiscount}%` : "−0%"}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function TierCard({
  tier,
  maxLimits,
  reserveBadge,
  tabLayoutId,
}: {
  tier: PricingProviderGroup["tiers"][number];
  maxLimits: number;
  reserveBadge: string;
  tabLayoutId: string;
}) {
  const defaultOption =
    tier.options.find((p) => p.highlight) ??
    tier.options.find((p) => p.durationMonths === 3) ??
    tier.options[0]!;

  const [selectedId, setSelectedId] = useState(defaultOption.id);
  const [compareSnapshot, setCompareSnapshot] = useState<{
    price: number;
    compareAt: number | null;
  } | null>(null);
  const selected =
    tier.options.find((p) => p.id === selectedId) ?? defaultOption;
  const discount = getDiscountPercent(selected);
  const promotionalBadge = isPromotionalBadge(selected.badge)
    ? selected.badge
    : null;
  const showCompare =
    selected.compareAtPrice !== null &&
    selected.compareAtPrice > selected.price;
  const showDiscountBadge = discount !== null && discount > 0;

  const handleSelect = useCallback(
    (id: string) => {
      if (id === selectedId) return;
      setCompareSnapshot({
        price: selected.price,
        compareAt: selected.compareAtPrice,
      });
      setSelectedId(id);
    },
    [selected.compareAtPrice, selected.price, selectedId],
  );

  const handlePriceSettled = useCallback(() => {
    setCompareSnapshot(null);
  }, []);

  const priceCompareValue = compareSnapshot?.price ?? selected.price;
  const compareAtCompareValue =
    compareSnapshot?.compareAt ?? selected.compareAtPrice ?? selected.price;

  const priceReserveValues = useMemo(
    () => tier.options.map((option) => option.price),
    [tier.options],
  );

  const compareAtReserveValues = useMemo(
    () =>
      tier.options.flatMap((option) =>
        option.compareAtPrice !== null ? [option.compareAtPrice] : [],
      ),
    [tier.options],
  );

  const maxDiscount = useMemo(
    () =>
      tier.options.reduce((max, option) => {
        const value = getDiscountPercent(option);
        return value !== null && value > max ? value : max;
      }, 0),
    [tier.options],
  );

  const maxCompareAtPrice = useMemo(
    () =>
      compareAtReserveValues.length > 0
        ? Math.max(...compareAtReserveValues)
        : 0,
    [compareAtReserveValues],
  );

  const showMetaRow = compareAtReserveValues.length > 0 || maxDiscount > 0;
  const reserveDiscountLabel = formatDiscountLabel(maxDiscount);

  return (
    <div className="relative flex h-full flex-col pt-3">
      <div className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <span className="inline-grid">
          <Badge
            className="invisible col-start-1 row-start-1 px-3 shadow-sm"
            aria-hidden
          >
            {reserveBadge}
          </Badge>
          {promotionalBadge && (
            <Badge className="col-start-1 row-start-1 px-3 shadow-sm">
              {promotionalBadge}
            </Badge>
          )}
        </span>
      </div>
      <Card
        className={cn(
          "flex h-full flex-1 flex-col ring-2",
          tier.highlight ? "ring-primary shadow-xs" : "ring-foreground/10",
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
            onSelect={handleSelect}
            layoutId={tabLayoutId}
          />

          <div className="flex min-h-14 flex-col justify-end gap-0.5">
            <div className="flex flex-wrap items-end gap-2">
              <AnimatedPrice
                value={selected.price}
                compareValue={priceCompareValue}
                reserveValues={priceReserveValues}
                currency={selected.currency}
                onSettled={handlePriceSettled}
                className="text-3xl font-bold tabular-nums text-foreground"
              />
              <span className="mb-1 text-sm text-muted-foreground">
                / {selected.period}
              </span>
            </div>
            <div className="flex min-h-5 w-full items-center gap-2">
              {showMetaRow ? (
                <>
                  <AnimatedPrice
                    value={
                      showCompare ? selected.compareAtPrice! : maxCompareAtPrice
                    }
                    compareValue={
                      showCompare ? compareAtCompareValue : maxCompareAtPrice
                    }
                    reserveValues={compareAtReserveValues}
                    currency={selected.currency}
                    onSettled={handlePriceSettled}
                    strikethrough
                    className={cn(
                      "shrink-0 text-sm text-muted-foreground",
                      !showCompare && "invisible",
                    )}
                  />
                  {maxDiscount > 0 && (
                    <span className="inline-grid shrink-0">
                      <Badge
                        variant="secondary"
                        className="invisible col-start-1 row-start-1 border-transparent bg-transparent px-2 text-primary"
                        aria-hidden
                      >
                        {reserveDiscountLabel}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "col-start-1 row-start-1 border-transparent bg-primary/10 px-2 text-primary",
                          !showDiscountBadge && "invisible",
                        )}
                      >
                        {showDiscountBadge
                          ? formatDiscountLabel(discount)
                          : reserveDiscountLabel}
                      </Badge>
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
  catalog,
}: {
  catalog: PricingProviderGroup[];
}) {
  const defaultProvider = catalog[0]?.id ?? "codex";

  const reserveBadge = useMemo(() => {
    let widest = "";

    for (const provider of catalog) {
      for (const tier of provider.tiers) {
        for (const option of tier.options) {
          if (
            isPromotionalBadge(option.badge) &&
            option.badge.length > widest.length
          ) {
            widest = option.badge;
          }
        }
      }
    }

    return widest || "Популярный";
  }, [catalog]);

  const [activeProvider, setActiveProvider] = useState(defaultProvider);

  if (catalog.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Тарифы скоро появятся.
      </p>
    );
  }

  return (
    <Tabs
      value={activeProvider}
      onValueChange={setActiveProvider}
      className="w-full gap-8"
    >
      <TabsPrimitive.List className="mx-auto flex h-auto w-full max-w-2xl flex-wrap justify-center gap-1 rounded-lg bg-muted p-1">
        {catalog.map((provider) => {
          const isSelected = activeProvider === provider.id;

          return (
            <TabsPrimitive.Trigger
              key={provider.id}
              value={provider.id}
              asChild
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  "relative z-10 inline-flex min-h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium outline-none",
                  isSelected
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId={PROVIDER_TAB_LAYOUT_ID}
                    className="absolute inset-0 rounded-md bg-background shadow-sm"
                    style={{ borderRadius: 6 }}
                    transition={TAB_SELECT_TRANSITION}
                  />
                )}
                <span className="relative z-10">{provider.label}</span>
              </motion.button>
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>

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
                reserveBadge={reserveBadge}
                tabLayoutId={`${provider.id}-${tier.id}-duration-tab`}
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
