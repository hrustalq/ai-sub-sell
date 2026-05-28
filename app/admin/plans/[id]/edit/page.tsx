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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Link
        href="/admin/plans"
        className="mb-6 w-fit shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← К списку тарифов
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlanForm mode="edit" plan={plan} />
      </div>
    </div>
  );
}
