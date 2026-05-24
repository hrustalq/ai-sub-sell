import type { Plan, PricingProviderGroup, PricingTierGroup } from "@/lib/plans/types";
import { PROVIDERS, getProviderMeta } from "@/lib/plans/catalog";

export type { PricingProviderGroup, PricingTierGroup };

export function groupPlansByProvider(plans: Plan[]): PricingProviderGroup[] {
  const byProvider = new Map<string, Map<string, Plan[]>>();

  for (const plan of plans) {
    if (!byProvider.has(plan.provider)) {
      byProvider.set(plan.provider, new Map());
    }
    const tiers = byProvider.get(plan.provider)!;
    if (!tiers.has(plan.tier)) {
      tiers.set(plan.tier, []);
    }
    tiers.get(plan.tier)!.push(plan);
  }

  const providerOrder = [...PROVIDERS].sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedProviderIds = [
    ...providerOrder.map((p) => p.id).filter((id) => byProvider.has(id)),
    ...[...byProvider.keys()].filter(
      (id) => !providerOrder.some((p) => p.id === id),
    ),
  ];

  return orderedProviderIds.map((providerId) => {
    const meta = getProviderMeta(providerId);
    const tierMap = byProvider.get(providerId)!;

    const tiers: PricingTierGroup[] = [...tierMap.entries()]
      .map(([tierId, options]) => {
        const sorted = [...options].sort(
          (a, b) => a.durationMonths - b.durationMonths,
        );
        const first = sorted[0]!;
        return {
          id: tierId,
          label: first.tierLabel,
          limits: first.limits,
          tag: first.tag,
          highlight: sorted.some((p) => p.highlight),
          options: sorted,
        };
      })
      .sort((a, b) => {
        const orderA = a.options[0]?.sortOrder ?? 0;
        const orderB = b.options[0]?.sortOrder ?? 0;
        return orderA - orderB;
      });

    return {
      id: providerId,
      label: meta?.label ?? providerId,
      description: meta?.description ?? "",
      tiers,
    };
  });
}

export function getDiscountPercent(plan: Plan): number | null {
  if (!plan.compareAtPrice || plan.compareAtPrice <= plan.price) return null;
  return Math.round((1 - plan.price / plan.compareAtPrice) * 100);
}
