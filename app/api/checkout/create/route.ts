import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { createPayment } from "@/lib/yookassa";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let planId: string;
  try {
    ({ planId } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const plan = getPlan(planId);
  if (!plan) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const orderId = crypto.randomUUID();
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  await db.order.create({
    data: {
      id: orderId,
      userId: session.user.id,
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
      userId: session.user.id,
      amount: plan.price.toFixed(2),
      currency: plan.currency,
      description: plan.name,
      returnUrl: `${baseUrl}/checkout/success?orderId=${orderId}`,
    });
  } catch (err) {
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

  return Response.json({ confirmationUrl: payment.confirmation.confirmation_url });
}
