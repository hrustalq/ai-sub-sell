import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { PlanForm } from "@/app/admin/_components/plan-form";

export default async function NewPlanPage() {
  await requireAdmin();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Link
        href="/admin/plans"
        className="mb-6 w-fit shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← К списку тарифов
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlanForm mode="create" />
      </div>
    </div>
  );
}
