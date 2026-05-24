import "server-only";

import db from "@/lib/db";
import { getUnreadCountsForOrders } from "@/lib/orders/read-state";

export async function getUserOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      confirmationUrl: true,
      createdAt: true,
    },
  });

  const unreadCounts = await getUnreadCountsForOrders(
    orders.map((order) => order.id),
    "buyer",
  );

  return orders.map((order) => ({
    ...order,
    unreadCount: unreadCounts.get(order.id) ?? 0,
  }));
}
