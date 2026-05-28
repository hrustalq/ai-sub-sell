import { notFound } from "next/navigation";
import { getAdminUserById, getAdminUserPayments } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin";
import type { AdminPaymentRecord, AdminUserDetailRecord } from "@/lib/admin/types";
import { routes } from "@/lib/routes";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { UserSettingsCard } from "@/app/admin/_components/user-settings-card";
import { UserPaymentsSection } from "@/app/admin/_components/user-payments-section";

export default async function AdminUserSettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { permissions } = await requireAdmin();
  const { userId } = await params;

  const [user, payments] = await Promise.all([
    getAdminUserById(userId),
    getAdminUserPayments(userId),
  ]);

  if (!user) notFound();

  const data: AdminUserDetailRecord = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };

  const paymentRecords: AdminPaymentRecord[] = payments.map((payment) => ({
    ...payment,
    createdAt: payment.createdAt.toISOString(),
  }));

  return (
    <AdminPageShell
      fill
      backHref={routes.admin.users}
      backLabel="← К пользователям"
      title={user.name}
      description={user.email}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <UserSettingsCard user={data} canManageRbac={permissions.canManageRbac} />
        <UserPaymentsSection payments={paymentRecords} />
      </div>
    </AdminPageShell>
  );
}
