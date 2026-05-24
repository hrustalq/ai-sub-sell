import { getAdminPayments } from "@/lib/admin/queries";
import type { AdminPaymentRecord } from "@/lib/admin/types";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { PaymentsTable } from "@/app/admin/_components/payments-table";

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();

  const data: AdminPaymentRecord[] = payments.map((payment) => ({
    ...payment,
    createdAt: payment.createdAt.toISOString(),
  }));

  return (
    <AdminPageShell
      fill
      title="Платежи"
      description="Заказы и статусы оплаты"
    >
      <PaymentsTable data={data} />
    </AdminPageShell>
  );
}
