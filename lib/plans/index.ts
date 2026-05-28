import "server-only";

export type { Plan, PlanData, ProviderMeta, PricingProviderGroup, PricingTierGroup } from "@/lib/plans/types";
export { formatPrice } from "@/lib/plans/format";
export {
  DEFAULT_PROVIDERS,
  DURATION_OPTIONS,
  buildDefaultPlans,
  formatDurationPeriod,
} from "@/lib/plans/catalog";
export { groupPlansByProvider, getDiscountPercent } from "@/lib/plans/grouping";
export { getPricingCatalog } from "@/lib/plans/pricing-catalog";
export {
  findProviderMeta,
  getProviderLabel,
  parseProviderInput,
  PROVIDER_ID_PATTERN,
  type ProviderInput,
} from "@/lib/plans/provider-validation";
export { PLAN_ID_PATTERN, parsePlanInput, type PlanInput } from "@/lib/plans/validation";
export { LEGACY_PLAN_IDS, planToDbRecord } from "@/lib/plans/seed";
export {
  mapPlanRow,
  getPlans,
  getAllPlans,
  getPlan,
  getPlanById,
  seedPlansCatalog,
  seedPlansIfEmpty,
} from "@/lib/plans/repository";
export {
  mapProviderRow,
  getActiveProviders,
  getAllProviders,
  getProviderById,
  seedProvidersCatalog,
  seedProvidersIfEmpty,
} from "@/lib/plans/providers";
