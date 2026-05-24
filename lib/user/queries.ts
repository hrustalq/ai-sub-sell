import "server-only";

import db from "@/lib/db";

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

  return orders;
}
