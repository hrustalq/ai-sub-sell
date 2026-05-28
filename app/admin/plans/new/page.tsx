import { requireAdmin } from "@/lib/admin";
import { getAdminProviders } from "@/lib/admin/plans";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { PlanForm } from "@/app/admin/_components/plan-form";

export default async function NewPlanPage() {
  await requireAdmin();
  const providers = await getAdminProviders();

  return (
    <AdminPageShell fill>
      <PlanForm mode="create" providers={providers} />
    </AdminPageShell>
  );
}
