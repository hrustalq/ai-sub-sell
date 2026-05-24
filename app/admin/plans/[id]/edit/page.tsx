import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getPlanById } from "@/lib/plans";
import { PlanForm } from "@/app/admin/_components/plan-form";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const plan = await getPlanById(id);
  if (!plan) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <Link
        href="/admin/plans"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
      >
        ← К списку тарифов
      </Link>
      <PlanForm mode="edit" plan={plan} />
    </div>
  );
}
