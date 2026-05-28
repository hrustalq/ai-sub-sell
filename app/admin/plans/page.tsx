import { seedPlansIfEmpty } from "@/lib/plans";
import { getAdminPlanGroups, getAdminProviders } from "@/lib/admin/plans";
import { AdminPlansPageClient } from "@/app/admin/_components/admin-plans-page-client";

export default async function AdminPlansPage() {
  await seedPlansIfEmpty();
  const [groups, providers] = await Promise.all([
    getAdminPlanGroups(),
    getAdminProviders(),
  ]);

  return <AdminPlansPageClient groups={groups} providers={providers} />;
}
