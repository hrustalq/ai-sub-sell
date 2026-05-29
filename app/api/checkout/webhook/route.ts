import db from "@/lib/db";
import {
  generateOrderAccessToken,
  hashOrderAccessToken,
} from "@/lib/orders/access";
import {
  sendOrderPaidEmail,
  sendPaymentReceiptEmail,
} from "@/lib/orders/emails";
import { createLogger, logError } from "@/lib/logger";
import { scheduleMessageEmailReminders } from "@/lib/orders/message-reminders";

const log = createLogger("webhook");

export async function POST(req: Request) {
  let event: {
    event: string;
    object: { id: string; status: string; metadata?: Record<string, string> };
  };
  try {
    event = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const orderId = event.object?.metadata?.orderId;
  if (!orderId) return new Response(null, { status: 200 });

  log.info({ orderId, event: event.event, paymentId: event.object.id }, "payment webhook");

  if (event.event === "payment.succeeded") {
    const accessToken = generateOrderAccessToken();

    const updated = await db.order
      .update({
        where: { id: orderId },
        data: {
          status: "PAID",
          accessTokenHash: hashOrderAccessToken(accessToken),
        },
        select: {
          id: true,
          orderNumber: true,
          planName: true,
          amount: true,
          currency: true,
          buyerEmail: true,
          receiptEmailSentAt: true,
          paidEmailSentAt: true,
        },
      })
      .catch(() => null);

    if (updated) {
      const existingWelcome = await db.orderMessage.findFirst({
        where: { orderId, author: "seller" },
        select: { id: true },
      });
      if (!existingWelcome) {
        const welcomeId = crypto.randomUUID();
        const welcome = await db.orderMessage
          .create({
            data: {
              id: welcomeId,
              orderId,
              author: "seller",
              body: "Спасибо за оплату! Данные доступа — на странице заказа и в письме. В Telegram отправьте номер заказа (ABCD-EFGH) или откройте ссылку с сайта.",
            },
          })
          .catch(() => null);

        if (welcome) {
          await scheduleMessageEmailReminders({
            orderId,
            messageId: welcomeId,
            messageAuthor: "seller",
            buyerEmail: updated.buyerEmail,
            planName: updated.planName,
          }).catch((err) =>
            logError(log, "schedule welcome reminder failed", err, { orderId }),
          );
        }
      }

      try {
        await sendPaymentReceiptEmail(updated);
      } catch (err) {
        logError(log, "receipt email failed", err, { orderId });
      }

      try {
        await sendOrderPaidEmail(updated, accessToken);
      } catch (err) {
        logError(log, "paid email failed", err, { orderId });
      }

      const { notifyBuyerOrderPaid } = await import("@/lib/telegram/notify");
      await notifyBuyerOrderPaid(orderId).catch((err) =>
        logError(log, "telegram notify failed", err, { orderId }),
      );
    }
  } else if (event.event === "payment.canceled") {
    await db.order
      .update({ where: { id: orderId }, data: { status: "CANCELED" } })
      .catch(() => null);
  }

  return new Response(null, { status: 200 });
}
