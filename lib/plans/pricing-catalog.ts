import "server-only";

import { groupPlansByProvider } from "@/lib/plans/grouping";
import { getActiveProviders } from "@/lib/plans/providers";
import { getPlans, seedPlansIfEmpty } from "@/lib/plans/repository";
import type { PricingProviderGroup } from "@/lib/plans/types";

export async function getPricingCatalog(): Promise<PricingProviderGroup[]> {
  await seedPlansIfEmpty();
  const [plans, providers] = await Promise.all([
    getPlans(),
    getActiveProviders(),
  ]);
  return groupPlansByProvider(plans, providers);
}
