import type { PlanData } from "@/lib/plans/types";

export const LEGACY_PLAN_IDS = [
  "weekly",
  "standard15",
  "stable30",
  "pro30",
] as const;

export function planToDbRecord(plan: PlanData) {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    period: plan.period,
    limits: JSON.stringify(plan.limits),
    tag: plan.tag,
    badge: plan.badge,
    highlight: plan.highlight,
    active: plan.active ?? true,
    sortOrder: plan.sortOrder ?? 0,
    provider: plan.provider,
    tier: plan.tier,
    tierLabel: plan.tierLabel,
    durationMonths: plan.durationMonths,
    compareAtPrice: plan.compareAtPrice,
  };
}
