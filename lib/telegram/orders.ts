import "server-only";

import db from "@/lib/db";
import { createCheckoutOrder } from "@/lib/checkout/create-order";
import { getOrderMessages } from "@/lib/orders/queries";
import { createOrderMessage } from "@/lib/orders/messages";
import { notifySupportNewTelegramOrder } from "@/lib/telegram/notify";
import { setTelegramAccountEmail } from "@/lib/telegram/accounts";

export async function listBuyerTelegramOrders(telegramUserId: string) {
  return db.order.findMany({
    where: { buyerTelegramUserId: telegramUserId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerEmail: true,
      confirmationUrl: true,
      productContent: true,
      createdAt: true,
    },
  });
}

export async function getBuyerTelegramOrder(
  telegramUserId: string,
  orderId: string,
) {
  return db.order.findFirst({
    where: { id: orderId, buyerTelegramUserId: telegramUserId },
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerEmail: true,
      confirmationUrl: true,
      productContent: true,
      createdAt: true,
    },
  });
}

export async function createTelegramCheckout(params: {
  telegramUserId: string;
  planId: string;
  email: string;
}) {
  await setTelegramAccountEmail(params.telegramUserId, params.email);

  const result = await createCheckoutOrder({
    planId: params.planId,
    buyerEmail: params.email,
    buyerTelegramUserId: params.telegramUserId,
  });

  if (result.ok) {
    await notifySupportNewTelegramOrder(result.orderId).catch((err) =>
      console.error("[telegram] support notify failed", err),
    );
  }

  return result;
}

export async function getOrderChatMessages(orderId: string) {
  return getOrderMessages(orderId);
}

export async function postBuyerMessage(orderId: string, telegramUserId: string, body: string) {
  const order = await getBuyerTelegramOrder(telegramUserId, orderId);
  if (!order) {
    return { ok: false as const, error: "Заказ не найден" };
  }

  return createOrderMessage({ orderId, author: "buyer", body });
}

export async function postSellerMessage(orderId: string, body: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) {
    return { ok: false as const, error: "Заказ не найден" };
  }

  return createOrderMessage({ orderId, author: "seller", body });
}

export { updateOrderFulfillment } from "@/lib/orders/fulfillment";
