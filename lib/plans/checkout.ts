import type { Plan } from "@/lib/plans/types";

const TIER_ORDER = ["trial", "standard", "pro"] as const;

export function tierSortIndex(tier: string): number {
  const i = TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
  return i === -1 ? 99 : i;
}

export function getDurationLabel(months: number): string {
  if (months === 0) return "1 нед";
  if (months === 1) return "1 мес";
  return `${months} мес`;
}

export function getProviderPlans(plans: Plan[], providerId: string): Plan[] {
  return plans.filter((p) => p.provider === providerId);
}

export function getDurationOptions(providerPlans: Plan[], tier: string): Plan[] {
  return providerPlans
    .filter((p) => p.tier === tier)
    .sort((a, b) => a.durationMonths - b.durationMonths);
}

export function pickPlanForDuration(tierPlans: Plan[], durationMonths: number): Plan | undefined {
  const exact = tierPlans.find((p) => p.durationMonths === durationMonths);
  if (exact) return exact;

  return [...tierPlans].sort(
    (a, b) =>
      Math.abs(a.durationMonths - durationMonths) -
      Math.abs(b.durationMonths - durationMonths),
  )[0];
}

export function getUpgradePlans(
  providerPlans: Plan[],
  currentTier: string,
  durationMonths: number,
): Plan[] {
  const currentIndex = tierSortIndex(currentTier);

  return [...new Set(providerPlans.map((p) => p.tier))]
    .filter((tier) => tierSortIndex(tier) > currentIndex)
    .sort((a, b) => tierSortIndex(a) - tierSortIndex(b))
    .map((tier) => {
      const tierPlans = providerPlans.filter((p) => p.tier === tier);
      return pickPlanForDuration(tierPlans, durationMonths);
    })
    .filter((p): p is Plan => p !== undefined);
}
