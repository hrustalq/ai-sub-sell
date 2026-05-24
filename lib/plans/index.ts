import "server-only";

export type { Plan, PlanData, ProviderId, ProviderMeta, PricingProviderGroup, PricingTierGroup } from "@/lib/plans/types";
export { formatPrice } from "@/lib/plans/format";
export {
  PROVIDERS,
  DURATION_OPTIONS,
  buildDefaultPlans,
  formatDurationPeriod,
  getProviderLabel,
  getProviderMeta,
} from "@/lib/plans/catalog";
export { groupPlansByProvider, getDiscountPercent } from "@/lib/plans/grouping";
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
