import { PROVIDERS, getProviderMeta } from "@/lib/plans/catalog";
import type { AdminPlanRecord, AdminPlansProviderGroup } from "@/lib/admin/types";

export type { AdminPlansProviderGroup };

export function groupAdminPlansByProvider(
  plans: AdminPlanRecord[],
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

  const providerOrder = [...PROVIDERS].sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedIds = [
    ...providerOrder.map((p) => p.id).filter((id) => byProvider.has(id)),
    ...[...byProvider.keys()].filter((id) => !providerOrder.some((p) => p.id === id)),
  ];

  return orderedIds.map((providerId) => {
    const meta = getProviderMeta(providerId);
    return {
      id: providerId,
      label: meta?.label ?? providerId,
      description: meta?.description ?? "",
      plans: byProvider.get(providerId) ?? [],
    };
  });
}
