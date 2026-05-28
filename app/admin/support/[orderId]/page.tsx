import { notFound } from "next/navigation";
import { getSupportOrder } from "@/lib/support/queries";
import { getOrderMessages } from "@/lib/orders/queries";
import { getOrderUnreadCount, markOrderMessagesRead } from "@/lib/orders/read-state";
import { requireSupport } from "@/lib/admin";
import { routes } from "@/lib/routes";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { SupportOrderView } from "@/app/admin/_components/support-order-view";

export default async function AdminSupportOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireSupport();
  const { orderId } = await params;

  const [order, messages, unreadCount] = await Promise.all([
    getSupportOrder(orderId),
    getOrderMessages(orderId),
    getOrderUnreadCount(orderId, "seller"),
  ]);

  if (!order) notFound();

  await markOrderMessagesRead(orderId, "seller");

  return (
    <AdminPageShell
      fill
      backHref={routes.admin.support}
      backLabel="← К заказам"
      title={order.planName}
      description={`№ ${order.id}`}
    >
      <SupportOrderView
        order={{
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        }}
        initialMessages={messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        }))}
        initialUnreadCount={unreadCount}
      />
    </AdminPageShell>
  );
}
