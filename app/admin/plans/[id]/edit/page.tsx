import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getAdminProviders } from "@/lib/admin/plans";
import { getPlanById } from "@/lib/plans";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { PlanForm } from "@/app/admin/_components/plan-form";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [plan, providers] = await Promise.all([getPlanById(id), getAdminProviders()]);
  if (!plan) notFound();

  return (
    <AdminPageShell fill>
      <PlanForm mode="edit" plan={plan} providers={providers} />
    </AdminPageShell>
  );
}
