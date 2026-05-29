import "server-only";

import db from "@/lib/db";
import { createCheckoutOrder } from "@/lib/checkout/create-order";
import { getOrderMessages } from "@/lib/orders/queries";
import { createOrderMessage } from "@/lib/orders/messages";
import { createLogger, logError } from "@/lib/logger";
import { notifySupportNewTelegramOrder } from "@/lib/telegram/notify";
import { getTelegramAccount } from "@/lib/telegram/accounts";
import { normalizeEmail } from "@/lib/users/placeholder";

const log = createLogger("telegram-orders");

async function buyerOrderScope(telegramUserId: string) {
  const account = await getTelegramAccount(telegramUserId);
  return {
    OR: [
      { buyerTelegramUserId: telegramUserId },
      ...(account?.email ? [{ buyerEmail: account.email }] : []),
    ],
  };
}

export async function listBuyerTelegramOrders(telegramUserId: string) {
  return db.order.findMany({
    where: await buyerOrderScope(telegramUserId),
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
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
    where: { id: orderId, ...(await buyerOrderScope(telegramUserId)) },
    select: {
      id: true,
      orderNumber: true,
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
  const normalizedEmail = normalizeEmail(params.email);
  const account = await getTelegramAccount(params.telegramUserId);
  if (!account?.email || account.email !== normalizedEmail) {
    return {
      ok: false as const,
      error: "Сначала подтвердите email кодом из письма: /email your@mail.com",
    };
  }

  const result = await createCheckoutOrder({
    planId: params.planId,
    buyerEmail: params.email,
    buyerTelegramUserId: params.telegramUserId,
  });

  if (result.ok) {
    await notifySupportNewTelegramOrder(result.orderId).catch((err) =>
      logError(log, "support notify failed", err, { orderId: result.orderId }),
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
