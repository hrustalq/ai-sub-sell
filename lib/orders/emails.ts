import "server-only";

import { createElement } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import db from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getAppBaseUrl, orderPageUrl, signInMagicLinkUrl } from "@/lib/email/urls";
import { routes } from "@/lib/routes";
import { formatPrice } from "@/lib/plans/format";
import { OrderPaidEmail } from "@/emails/order-paid";
import { OrderFulfillmentEmail } from "@/emails/order-fulfillment";
import { PaymentReceiptEmail } from "@/emails/payment-receipt";
import { NewMessageEmail } from "@/emails/new-message";
import { formatOrderNumber } from "@/lib/orders/order-number";
import {
  getTelegramBotLabel,
  getTelegramOrderDeepLink,
} from "@/lib/telegram/links";

type OrderEmailRow = {
  id: string;
  orderNumber: string;
  planName: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  receiptEmailSentAt: Date | null;
  paidEmailSentAt: Date | null;
};

export async function sendPaymentReceiptEmail(
  order: OrderEmailRow,
  paidAt: Date = new Date(),
): Promise<void> {
  if (order.receiptEmailSentAt) return;

  const amountFormatted = formatPrice(order.amount, order.currency);
  const paidAtLabel = format(paidAt, "d MMMM yyyy, HH:mm", { locale: ru });

  await sendEmail({
    to: order.buyerEmail,
    subject: `Квитанция об оплате — ${order.planName}`,
    template: createElement(PaymentReceiptEmail, {
      planName: order.planName,
      amountFormatted,
      orderNumber: formatOrderNumber(order.orderNumber),
      paidAt: paidAtLabel,
    }),
  });

  await db.order.update({
    where: { id: order.id },
    data: { receiptEmailSentAt: paidAt },
  });
}

export async function sendOrderPaidEmail(
  order: OrderEmailRow,
  accessToken: string,
): Promise<void> {
  if (order.paidEmailSentAt) return;

  const amountFormatted = formatPrice(order.amount, order.currency);
  const orderUrl = orderPageUrl(order.id, accessToken);
  const signInUrl = signInMagicLinkUrl(`/orders/${order.id}`);

  await sendEmail({
    to: order.buyerEmail,
    subject: `Заказ оплачен — ${order.planName}`,
    template: createElement(OrderPaidEmail, {
      planName: order.planName,
      amountFormatted,
      orderNumber: formatOrderNumber(order.orderNumber),
      orderUrl,
      telegramBotUrl: getTelegramOrderDeepLink(order.id),
      signInUrl,
    }),
  });

  await db.order.update({
    where: { id: order.id },
    data: { paidEmailSentAt: new Date() },
  });
}

/** Web checkout buyers (no Telegram on order) — credentials + chat via bot. */
export async function sendOrderFulfillmentEmail(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      planName: true,
      buyerEmail: true,
      productContent: true,
      buyerTelegramUserId: true,
      accessTokenHash: true,
    },
  });

  if (!order?.productContent?.trim() || order.buyerTelegramUserId) return;

  const orderUrl = orderPageUrl(order.id);

  await sendEmail({
    to: order.buyerEmail,
    subject: `Доступ готов — ${order.planName}`,
    template: createElement(OrderFulfillmentEmail, {
      planName: order.planName,
      orderNumber: formatOrderNumber(order.orderNumber),
      productContent: order.productContent.trim(),
      orderUrl,
      telegramBotLabel: getTelegramBotLabel(),
      telegramBotUrl: getTelegramOrderDeepLink(order.id),
    }),
  });
}

export async function sendNewMessageEmail(params: {
  to: string;
  planName: string;
  orderId: string;
  messagePreview: string;
  recipientRole: "buyer" | "support";
}): Promise<void> {
  const preview =
    params.messagePreview.length > 200
      ? `${params.messagePreview.slice(0, 199)}…`
      : params.messagePreview;

  const orderUrl =
    params.recipientRole === "support"
      ? `${getAppBaseUrl()}${routes.admin.supportOrder(params.orderId)}`
      : (getTelegramOrderDeepLink(params.orderId) ??
        signInMagicLinkUrl(routes.order(params.orderId)));

  await sendEmail({
    to: params.to,
    subject: `Новое сообщение — ${params.planName}`,
    template: createElement(NewMessageEmail, {
      planName: params.planName,
      orderId: params.orderId,
      preview,
      orderUrl,
      recipientRole: params.recipientRole,
    }),
  });
}
