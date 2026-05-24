import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { getPlan } from "@/lib/plans";
import {
  generateOrderAccessToken,
  hashOrderAccessToken,
  isValidEmail,
} from "@/lib/orders/access";
import { resolveBuyerUserId } from "@/lib/users/placeholder";
import { createPayment } from "@/lib/yookassa";

export async function POST(req: Request) {
  let planId: string;
  let email: string | undefined;

  try {
    ({ planId, email } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!planId) {
    return Response.json({ error: "Тариф не указан" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const buyerEmail = (session?.user?.email ?? email ?? "").trim().toLowerCase();

  if (!buyerEmail || !isValidEmail(buyerEmail)) {
    return Response.json({ error: "Укажите корректный email" }, { status: 400 });
  }

  const plan = await getPlan(planId);
  if (!plan) {
    return Response.json({ error: "Тариф не найден или недоступен" }, { status: 400 });
  }

  const userId = await resolveBuyerUserId(session?.user?.id, buyerEmail);

  const orderId = crypto.randomUUID();
  const accessToken = generateOrderAccessToken();
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const orderUrl = `${baseUrl}/orders/${orderId}?token=${accessToken}`;

  await db.order.create({
    data: {
      id: orderId,
      userId,
      buyerEmail,
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
    return Response.json({ error: "Payment gateway error" }, { status: 502 });
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      yookassaId: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
    },
  });

  return Response.json({
    confirmationUrl: payment.confirmation.confirmation_url,
    orderUrl,
  });
}
