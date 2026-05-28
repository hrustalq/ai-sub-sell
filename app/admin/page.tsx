import { redirect } from "next/navigation";
import { getAdminStats, getAdminActivityLog } from "@/lib/admin/queries";
import { requireAdminPanel } from "@/lib/admin";
import { routes } from "@/lib/routes";
import { AdminOverview } from "@/app/admin/_components/admin-overview";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";

export default async function AdminOverviewPage() {
  const { permissions } = await requireAdminPanel();
  if (!permissions.canAccessAdmin) {
    redirect(routes.admin.support);
  }

  const [stats, log] = await Promise.all([getAdminStats(), getAdminActivityLog(30)]);

  return (
    <AdminPageShell
      fill
      title="Обзор"
      description="Ключевые показатели и последние события"
    >
      <AdminOverview stats={stats} log={log} />
    </AdminPageShell>
  );
}
