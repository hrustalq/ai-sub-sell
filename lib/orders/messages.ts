import "server-only";

import db from "@/lib/db";
import {
  cancelMessageEmailReminders,
  scheduleMessageEmailReminders,
} from "@/lib/orders/message-reminders";
import { markOrderMessagesRead } from "@/lib/orders/read-state";
import { notifySupportOfBuyerMessage } from "@/lib/telegram/notify";

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
  }).catch((err) => console.error("[messages] schedule reminder failed", err));

  if (params.author === "buyer") {
    await notifySupportOfBuyerMessage({
      orderId: params.orderId,
      planName: order.planName,
      body: trimmed,
    }).catch((err) => console.error("[messages] telegram notify failed", err));
  } else {
    const { notifyBuyerNewSellerMessage } = await import("@/lib/telegram/notify");
    await notifyBuyerNewSellerMessage({
      orderId: params.orderId,
      planName: order.planName,
      body: trimmed,
    }).catch((err) => console.error("[messages] telegram buyer notify failed", err));
  }

  return { ok: true as const, message };
}
