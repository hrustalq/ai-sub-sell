import "server-only";

import db from "@/lib/db";
import {
  formatOrderNumber,
  normalizeOrderNumber,
  parseOrderNumberFromText,
} from "@/lib/orders/order-number";
import { getTelegramAccount } from "@/lib/telegram/accounts";

const ORDER_START_PREFIX = "order_";

export function buildTelegramOrderStartPayload(orderId: string): string {
  return `${ORDER_START_PREFIX}${orderId}`;
}

export function parseTelegramOrderStartPayload(
  payload: string,
): { orderId: string } | { orderNumber: string } | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(ORDER_START_PREFIX)) {
    const orderId = trimmed.slice(ORDER_START_PREFIX.length).trim();
    if (orderId.length >= 8) {
      return { orderId };
    }
    return null;
  }

  const fromNumber = parseOrderNumberFromText(trimmed);
  if (fromNumber) {
    return { orderNumber: fromNumber };
  }

  return null;
}

export async function findOrderByNumber(orderNumber: string) {
  const normalized = normalizeOrderNumber(orderNumber);
  return db.order.findUnique({
    where: { orderNumber: normalized },
    select: {
      id: true,
      orderNumber: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerEmail: true,
      productContent: true,
      confirmationUrl: true,
      buyerTelegramUserId: true,
    },
  });
}

export async function linkOrderToTelegramBuyer(
  telegramUserId: string,
  orderId: string,
): Promise<
  | {
      ok: true;
      order: NonNullable<Awaited<ReturnType<typeof findOrderById>>>;
    }
  | { ok: false; error: string }
> {
  const order = await findOrderById(orderId);
  if (!order) {
    return { ok: false, error: "Заказ не найден. Проверьте номер заказа." };
  }

  if (
    order.buyerTelegramUserId &&
    order.buyerTelegramUserId !== telegramUserId
  ) {
    return {
      ok: false,
      error: "Этот заказ уже привязан к другому Telegram-аккаунту.",
    };
  }

  const account = await getTelegramAccount(telegramUserId);
  if (account?.email && account.email !== order.buyerEmail) {
    return {
      ok: false,
      error: `Номер заказа не совпадает с email в боте (${account.email}). Сначала /email ${order.buyerEmail}`,
    };
  }

  if (order.buyerTelegramUserId !== telegramUserId) {
    await db.order.update({
      where: { id: order.id },
      data: { buyerTelegramUserId: telegramUserId },
    });
    order.buyerTelegramUserId = telegramUserId;
  }

  if (account && !account.email) {
    await db.telegramAccount.update({
      where: { telegramUserId },
      data: { email: order.buyerEmail },
    });
  }

  return { ok: true, order };
}

export async function linkOrderByNumber(
  telegramUserId: string,
  rawNumber: string,
): Promise<
  | {
      ok: true;
      order: NonNullable<Awaited<ReturnType<typeof findOrderById>>>;
    }
  | { ok: false; error: string }
> {
  const normalized = parseOrderNumberFromText(rawNumber);
  if (!normalized) {
    return {
      ok: false,
      error: "Укажите номер заказа в формате ABCD-EFGH (8 символов).",
    };
  }

  const order = await findOrderByNumber(normalized);
  if (!order) {
    return {
      ok: false,
      error: `Заказ ${formatOrderNumber(normalized)} не найден.`,
    };
  }

  return linkOrderToTelegramBuyer(telegramUserId, order.id);
}

async function findOrderById(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerEmail: true,
      productContent: true,
      confirmationUrl: true,
      buyerTelegramUserId: true,
    },
  });
}
