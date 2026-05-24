import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { PlanForm } from "@/app/admin/_components/plan-form";

export default async function NewPlanPage() {
  await requireAdmin();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <Link
        href="/admin/plans"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground w-fit"
      >
        ← К списку тарифов
      </Link>
      <PlanForm mode="create" />
    </div>
  );
}
