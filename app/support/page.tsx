import { getSupportOrders } from "@/lib/support/queries";
import type { SupportOrderRecord } from "@/lib/support/types";
import { PageShell } from "@/components/layout/page-shell";
import { SupportOrdersTable } from "@/app/support/_components/support-orders-table";

export default async function SupportPage() {
  const orders = await getSupportOrders();

  const data: SupportOrderRecord[] = orders.map((order) => ({
    id: order.id,
    status: order.status,
    planName: order.planName,
    amount: order.amount,
    currency: order.currency,
    buyerEmail: order.buyerEmail,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    messageCount: order.messageCount,
    unreadCount: order.unreadCount,
    needsReply: order.needsReply,
    user: order.user,
    lastMessage: order.lastMessage
      ? { ...order.lastMessage, createdAt: order.lastMessage.createdAt.toISOString() }
      : null,
  }));

  return (
    <PageShell fill title="Заказы" description="Переписка и статусы заказов покупателей">
      <SupportOrdersTable data={data} />
    </PageShell>
  );
}
