import { notFound } from "next/navigation";
import { getOrderAccessContext } from "@/lib/orders/access";
import { getOrderForBuyerPage, getOrderMessages } from "@/lib/orders/queries";
import { getOrderUnreadCount, markOrderMessagesRead } from "@/lib/orders/read-state";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { getTelegramBotLabel, getTelegramOrderDeepLink } from "@/lib/telegram/links";
import { OrderExperience } from "./order-experience";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderId } = await params;
  const { token } = await searchParams;

  const access = await getOrderAccessContext(orderId, token);
  if (!access) {
    notFound();
  }

  const order = await getOrderForBuyerPage(orderId);
  if (!order) notFound();

  const isStaffView = access.canManageFulfillment;
  const [messages, unreadCount] = isStaffView
    ? await Promise.all([
        getOrderMessages(orderId),
        getOrderUnreadCount(orderId, access.authorRole),
      ])
    : [[], 0];

  if (isStaffView) {
    await markOrderMessagesRead(orderId, access.authorRole);
  }

  return (
    <OrderExperience
      initialOrder={{
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      }}
      initialMessages={messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialUnreadCount={unreadCount}
      accessToken={token ?? null}
      canManageFulfillment={access.canManageFulfillment}
      authorRole={access.authorRole}
      telegramBotLabel={getTelegramBotLabel()}
      telegramBotUrl={getTelegramOrderDeepLink(orderId)}
      orderNumberLabel={formatOrderNumber(order.orderNumber)}
    />
  );
}
