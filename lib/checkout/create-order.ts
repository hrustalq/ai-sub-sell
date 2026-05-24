import "server-only";

import db from "@/lib/db";
import { getPlan } from "@/lib/plans";
import {
  generateOrderAccessToken,
  hashOrderAccessToken,
  isValidEmail,
} from "@/lib/orders/access";
import { resolveBuyerUserId } from "@/lib/users/placeholder";
import { absoluteUrl } from "@/lib/site-url";
import { createPayment } from "@/lib/yookassa";

export type CreateOrderInput = {
  planId: string;
  buyerEmail: string;
  sessionUserId?: string | null;
  buyerTelegramUserId?: string | null;
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      confirmationUrl: string;
      orderUrl: string;
      accessToken: string;
    }
  | { ok: false; error: string; status: number };

export async function createCheckoutOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const planId = input.planId?.trim();
  if (!planId) {
    return { ok: false, error: "Тариф не указан", status: 400 };
  }

  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  if (!buyerEmail || !isValidEmail(buyerEmail)) {
    return { ok: false, error: "Укажите корректный email", status: 400 };
  }

  const plan = await getPlan(planId);
  if (!plan) {
    return { ok: false, error: "Тариф не найден или недоступен", status: 400 };
  }

  const userId = await resolveBuyerUserId(input.sessionUserId, buyerEmail);

  const orderId = crypto.randomUUID();
  const accessToken = generateOrderAccessToken();
  const orderUrl = absoluteUrl(`/orders/${orderId}?token=${accessToken}`);

  await db.order.create({
    data: {
      id: orderId,
      userId,
      buyerEmail,
      buyerTelegramUserId: input.buyerTelegramUserId ?? undefined,
      accessTokenHash: hashOrderAccessToken(accessToken),
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      status: "PENDING",
    },
  });

  let payment;
  try {
    payment = await createPayment({
      orderId,
      planId: plan.id,
      userId,
      amount: plan.price.toFixed(2),
      currency: plan.currency,
      description: plan.name,
      returnUrl: orderUrl,
    });
  } catch {
    await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } });
    return { ok: false, error: "Payment gateway error", status: 502 };
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      yookassaId: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
    },
  });

  return {
    ok: true,
    orderId,
    confirmationUrl: payment.confirmation.confirmation_url,
    orderUrl,
    accessToken,
  };
}
