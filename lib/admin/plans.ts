import "server-only";

import { getAllPlans } from "@/lib/plans/repository";
import { groupAdminPlansByProvider } from "@/lib/admin/plans-grouping";
import type { AdminPlanRecord, AdminPlansProviderGroup } from "@/lib/admin/types";

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
  const plans = await getAllPlans();
  return groupAdminPlansByProvider(plans.map(toAdminPlanRecord));
}
