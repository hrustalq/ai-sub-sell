import "server-only";

import db from "@/lib/db";
import { createLogger, logError } from "@/lib/logger";
import { notifyBuyerFulfillmentUpdated } from "@/lib/telegram/notify";

const log = createLogger("fulfillment");

export async function updateOrderFulfillment(orderId: string, productContent: string) {
  const trimmed = productContent.trim();
  if (!trimmed || trimmed.length > 20000) {
    return { ok: false as const, error: "Данные товара должны быть от 1 до 20000 символов" };
  }

  await db.order.update({
    where: { id: orderId },
    data: { productContent: trimmed },
  });

  await notifyBuyerFulfillmentUpdated(orderId).catch((err) =>
    logError(log, "telegram notify failed", err, { orderId }),
  );

  return { ok: true as const };
}
