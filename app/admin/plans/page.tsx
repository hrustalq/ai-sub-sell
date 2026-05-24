import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { seedPlansIfEmpty } from "@/lib/plans";
import { getAdminPlanGroups } from "@/lib/admin/plans";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { PlansByProvider } from "@/app/admin/_components/plans-by-provider";
import { Button } from "@/components/ui/button";

export default async function AdminPlansPage() {
  await seedPlansIfEmpty();
  const groups = await getAdminPlanGroups();

  return (
    <AdminPageShell
      fill
      title="Тарифы"
      description="Тарифы сгруппированы по провайдеру — раскройте секцию для просмотра"
      actions={
        <Button asChild size="sm">
          <Link href="/admin/plans/new" className="gap-2">
            <PlusIcon className="size-4" />
            Новый тариф
          </Link>
        </Button>
      }
    >
      <PlansByProvider groups={groups} />
    </AdminPageShell>
  );
}
