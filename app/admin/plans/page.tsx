import { seedPlansIfEmpty } from "@/lib/plans";
import { requireAdmin } from "@/lib/admin";
import { getAdminPlanGroups, getAdminProviders } from "@/lib/admin/plans";
import { AdminPlansPageClient } from "@/app/admin/_components/admin-plans-page-client";

export default async function AdminPlansPage() {
  await requireAdmin();
  await seedPlansIfEmpty();
  const [groups, providers] = await Promise.all([
    getAdminPlanGroups(),
    getAdminProviders(),
  ]);

  return <AdminPlansPageClient groups={groups} providers={providers} />;
}
