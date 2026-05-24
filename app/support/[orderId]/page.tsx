import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupportOrder } from "@/lib/support/queries";
import { getOrderMessages } from "@/lib/orders/queries";
import { getOrderUnreadCount, markOrderMessagesRead } from "@/lib/orders/read-state";
import { SupportOrderView } from "@/app/support/_components/support-order-view";
import { Button } from "@/components/ui/button";

export default async function SupportOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const [order, messages, unreadCount] = await Promise.all([
    getSupportOrder(orderId),
    getOrderMessages(orderId),
    getOrderUnreadCount(orderId, "seller"),
  ]);

  if (!order) notFound();

  await markOrderMessagesRead(orderId, "seller");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="w-fit px-0">
        <Link href="/support">← К заказам</Link>
      </Button>
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
    </div>
  );
}
