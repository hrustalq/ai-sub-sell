import { requireSession } from "@/lib/auth-session";
import { getUserOrders } from "@/lib/user/queries";
import type { UserOrderRecord } from "@/lib/user/types";
import { PageShell } from "@/components/layout/page-shell";
import { UserPaymentsList } from "@/app/user/_components/user-payments-list";

export default async function UserPaymentsPage() {
  const session = await requireSession("/user/payments");
  const orders = await getUserOrders(session.user.id);

  const data: UserOrderRecord[] = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <PageShell
      fill
      title="Платежи"
      description="История ваших заказов и статусы оплаты"
    >
      <UserPaymentsList orders={data} />
    </PageShell>
  );
}
