import { findProviderMeta } from "@/lib/plans/provider-validation";
import type { ProviderMeta } from "@/lib/plans/types";
import type { AdminPlanRecord, AdminPlansProviderGroup } from "@/lib/admin/types";

export type { AdminPlansProviderGroup };

export function groupAdminPlansByProvider(
  plans: AdminPlanRecord[],
  providers: ProviderMeta[],
): AdminPlansProviderGroup[] {
  const byProvider = new Map<string, AdminPlanRecord[]>();

  for (const plan of plans) {
    const list = byProvider.get(plan.provider) ?? [];
    list.push(plan);
    byProvider.set(plan.provider, list);
  }

  for (const list of byProvider.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const providerOrder = [...providers].sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedIds = [
    ...providerOrder.map((provider) => provider.id),
    ...[...byProvider.keys()].filter(
      (id) => !providerOrder.some((provider) => provider.id === id),
    ),
  ];

  return orderedIds.map((providerId) => {
    const meta = findProviderMeta(providerId, providers);
    return {
      id: providerId,
      label: meta?.label ?? providerId,
      description: meta?.description ?? "",
      active: meta?.active ?? true,
      plans: byProvider.get(providerId) ?? [],
    };
  });
}
