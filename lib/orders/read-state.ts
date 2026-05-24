import "server-only";

import db from "@/lib/db";

export type MessageViewer = "buyer" | "seller";

function oppositeAuthor(viewer: MessageViewer): string {
  return viewer === "buyer" ? "seller" : "buyer";
}

export async function markOrderMessagesRead(
  orderId: string,
  viewer: MessageViewer,
): Promise<void> {
  await db.orderMessageRead.upsert({
    where: {
      orderId_viewer: { orderId, viewer },
    },
    create: {
      orderId,
      viewer,
      readAt: new Date(),
    },
    update: {
      readAt: new Date(),
    },
  });
}

export async function getOrderUnreadCount(
  orderId: string,
  viewer: MessageViewer,
): Promise<number> {
  const counts = await getUnreadCountsForOrders([orderId], viewer);
  return counts.get(orderId) ?? 0;
}

export async function getUnreadCountsForOrders(
  orderIds: string[],
  viewer: MessageViewer,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (orderIds.length === 0) return result;

  for (const orderId of orderIds) {
    result.set(orderId, 0);
  }

  const readStates = await db.orderMessageRead.findMany({
    where: {
      orderId: { in: orderIds },
      viewer,
    },
    select: { orderId: true, readAt: true },
  });

  const readAtByOrder = new Map(readStates.map((state) => [state.orderId, state.readAt]));

  const incoming = await db.orderMessage.findMany({
    where: {
      orderId: { in: orderIds },
      author: oppositeAuthor(viewer),
    },
    select: { orderId: true, createdAt: true },
  });

  for (const message of incoming) {
    const readAt = readAtByOrder.get(message.orderId) ?? new Date(0);
    if (message.createdAt > readAt) {
      result.set(message.orderId, (result.get(message.orderId) ?? 0) + 1);
    }
  }

  return result;
}

export async function getTotalUnreadCount(viewer: MessageViewer): Promise<number> {
  const incoming = await db.orderMessage.findMany({
    where: { author: oppositeAuthor(viewer) },
    select: { orderId: true, createdAt: true },
  });

  if (incoming.length === 0) return 0;

  const orderIds = [...new Set(incoming.map((message) => message.orderId))];
  const counts = await getUnreadCountsForOrders(orderIds, viewer);

  let total = 0;
  for (const count of counts.values()) {
    total += count;
  }
  return total;
}
