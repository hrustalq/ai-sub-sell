import "server-only";

import db from "@/lib/db";
import {
  cancelMessageEmailReminders,
  scheduleMessageEmailReminders,
} from "@/lib/orders/message-reminders";
import { markOrderMessagesRead } from "@/lib/orders/read-state";
import { createLogger, logError } from "@/lib/logger";
import { notifySupportOfBuyerMessage } from "@/lib/telegram/notify";

const log = createLogger("messages");

export type OrderMessageAuthor = "buyer" | "seller";

export async function createOrderMessage(params: {
  orderId: string;
  author: OrderMessageAuthor;
  body: string;
}) {
  const trimmed = params.body.trim();
  if (!trimmed || trimmed.length > 4000) {
    return { ok: false as const, error: "Сообщение должно быть от 1 до 4000 символов" };
  }

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    select: { buyerEmail: true, planName: true },
  });
  if (!order) {
    return { ok: false as const, error: "Заказ не найден" };
  }

  const message = await db.orderMessage.create({
    data: {
      id: crypto.randomUUID(),
      orderId: params.orderId,
      author: params.author,
      body: trimmed,
    },
    select: {
      id: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });

  await markOrderMessagesRead(params.orderId, params.author);
  await cancelMessageEmailReminders(params.orderId, params.author);

  await scheduleMessageEmailReminders({
    orderId: params.orderId,
    messageId: message.id,
    messageAuthor: params.author,
    buyerEmail: order.buyerEmail,
    planName: order.planName,
  }).catch((err) => logError(log, "schedule reminder failed", err, { orderId: params.orderId }));

  if (params.author === "buyer") {
    await notifySupportOfBuyerMessage({
      orderId: params.orderId,
      planName: order.planName,
      body: trimmed,
    }).catch((err) =>
      logError(log, "telegram support notify failed", err, { orderId: params.orderId }),
    );
  } else {
    const { notifyBuyerNewSellerMessage } = await import("@/lib/telegram/notify");
    await notifyBuyerNewSellerMessage({
      orderId: params.orderId,
      planName: order.planName,
      body: trimmed,
    }).catch((err) =>
      logError(log, "telegram buyer notify failed", err, { orderId: params.orderId }),
    );
  }

  return { ok: true as const, message };
}
