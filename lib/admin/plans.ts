import "server-only";

import { getAllPlans } from "@/lib/plans/repository";
import { getAllProviders } from "@/lib/plans/providers";
import { groupAdminPlansByProvider } from "@/lib/admin/plans-grouping";
import type {
  AdminPlanExportRow,
  AdminPlanRecord,
  AdminPlansProviderGroup,
} from "@/lib/admin/types";
import type { Plan } from "@/lib/plans/types";
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

export type GetAdminPlansForExportOptions = {
  limit?: number | "all";
  providerIds?: string[];
};

function planToExportRow(
  plan: Plan,
  group: AdminPlansProviderGroup,
): AdminPlanExportRow {
  const record = toAdminPlanRecord(plan);
  return {
    ...record,
    providerLabel: group.label,
    providerDescription: group.description,
    providerActive: group.active,
    tier: plan.tier,
    durationMonths: plan.durationMonths,
    tag: plan.tag,
    badge: plan.badge,
    limits: plan.limits.join("; "),
  };
}

export async function getAdminPlansForExport(
  options: GetAdminPlansForExportOptions = {},
): Promise<AdminPlanExportRow[]> {
  const [plans, providers] = await Promise.all([getAllPlans(), getAllProviders()]);

  const filteredPlans = options.providerIds?.length
    ? plans.filter((plan) => options.providerIds!.includes(plan.provider))
    : plans;

  const groups = groupAdminPlansByProvider(
    filteredPlans.map(toAdminPlanRecord),
    providers,
  );

  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const rows: AdminPlanExportRow[] = [];

  for (const group of groups) {
    for (const planRecord of group.plans) {
      const plan = planById.get(planRecord.id);
      if (!plan) continue;
      rows.push(planToExportRow(plan, group));
    }
  }

  if (options.limit !== "all" && typeof options.limit === "number") {
    return rows.slice(0, options.limit);
  }

  return rows;
}
