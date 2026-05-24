/**
 * Client-safe plan module — types, formatting, catalog metadata, grouping.
 * Do not import `@/lib/plans` (server-only) in client components.
 */

export type { Plan, PlanData, ProviderId, ProviderMeta, PricingProviderGroup, PricingTierGroup } from "@/lib/plans/types";
export { formatPrice } from "@/lib/plans/format";
export {
  PROVIDERS,
  DURATION_OPTIONS,
  formatDurationPeriod,
  getProviderLabel,
  getProviderMeta,
} from "@/lib/plans/catalog";
export { groupPlansByProvider, getDiscountPercent } from "@/lib/plans/grouping";
export {
  tierSortIndex,
  getDurationLabel,
  getProviderPlans,
  getDurationOptions,
  getUpgradePlans,
  pickPlanForDuration,
} from "@/lib/plans/checkout";
