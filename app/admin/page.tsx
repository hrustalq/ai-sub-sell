import { getAdminStats, getAdminActivityLog } from "@/lib/admin/queries";
import { AdminOverview } from "@/app/admin/_components/admin-overview";

export default async function AdminOverviewPage() {
  const [stats, log] = await Promise.all([getAdminStats(), getAdminActivityLog(30)]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <AdminOverview stats={stats} log={log} />
    </div>
  );
}
