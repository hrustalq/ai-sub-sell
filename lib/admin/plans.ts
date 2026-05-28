import "server-only";

import { getAllPlans } from "@/lib/plans/repository";
import { getAllProviders } from "@/lib/plans/providers";
import { groupAdminPlansByProvider } from "@/lib/admin/plans-grouping";
import type { AdminPlanRecord, AdminPlansProviderGroup } from "@/lib/admin/types";
import type { ProviderMeta } from "@/lib/plans/types";

export function toAdminPlanRecord(
  plan: Awaited<ReturnType<typeof getAllPlans>>[number],
): AdminPlanRecord {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    period: plan.period,
    provider: plan.provider,
    tierLabel: plan.tierLabel,
    compareAtPrice: plan.compareAtPrice,
    active: plan.active,
    highlight: plan.highlight,
    sortOrder: plan.sortOrder,
  };
}

export async function getAdminPlanGroups(): Promise<AdminPlansProviderGroup[]> {
  const [plans, providers] = await Promise.all([getAllPlans(), getAllProviders()]);
  return groupAdminPlansByProvider(plans.map(toAdminPlanRecord), providers);
}

export async function getAdminProviders(): Promise<ProviderMeta[]> {
  return getAllProviders();
}
