import "server-only";

import db from "@/lib/db";
import { getUnreadCountsForOrders } from "@/lib/orders/read-state";

export async function getSupportOrders() {
  const orders = await db.order.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          author: true,
          body: true,
          createdAt: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  const unreadCounts = await getUnreadCountsForOrders(
    orders.map((order) => order.id),
    "seller",
  );

  return orders.map((order) => {
    const lastMessage = order.messages[0] ?? null;
    const unreadCount = unreadCounts.get(order.id) ?? 0;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      planName: order.planName,
      amount: order.amount,
      currency: order.currency,
      buyerEmail: order.buyerEmail,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      messageCount: order._count.messages,
      unreadCount,
      needsReply: unreadCount > 0,
      user: order.user,
      lastMessage,
    };
  });
}

export async function getSupportOrder(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      planId: true,
      planName: true,
      amount: true,
      currency: true,
      buyerEmail: true,
      productContent: true,
      confirmationUrl: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
