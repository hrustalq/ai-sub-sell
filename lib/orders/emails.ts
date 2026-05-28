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
import { PaymentReceiptEmail } from "@/emails/payment-receipt";
import { NewMessageEmail } from "@/emails/new-message";

type OrderEmailRow = {
  id: string;
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
      orderId: order.id,
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
      orderId: order.id,
      orderUrl,
      signInUrl,
    }),
  });

  await db.order.update({
    where: { id: order.id },
    data: { paidEmailSentAt: new Date() },
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
      : signInMagicLinkUrl(routes.order(params.orderId));

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
