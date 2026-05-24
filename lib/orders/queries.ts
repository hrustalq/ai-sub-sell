import "server-only";

import db from "@/lib/db";

export async function getOrderForBuyerPage(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      planId: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerEmail: true,
      productContent: true,
      confirmationUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getOrderMessages(orderId: string) {
  return db.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });
}
