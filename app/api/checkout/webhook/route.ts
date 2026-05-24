import db from "@/lib/db";

export async function POST(req: Request) {
  let event: { event: string; object: { id: string; status: string; metadata?: Record<string, string> } };
  try {
    event = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const orderId = event.object?.metadata?.orderId;
  if (!orderId) return new Response(null, { status: 200 });

  if (event.event === "payment.succeeded") {
    const updated = await db.order
      .update({ where: { id: orderId }, data: { status: "PAID" } })
      .catch(() => null);

    if (updated) {
      const existingWelcome = await db.orderMessage.findFirst({
        where: { orderId, author: "seller" },
        select: { id: true },
      });
      if (!existingWelcome) {
        await db.orderMessage
          .create({
            data: {
              id: crypto.randomUUID(),
              orderId,
              author: "seller",
              body: "Спасибо за оплату! Мы подготовим данные доступа и разместим их на этой странице. Если есть вопросы — напишите здесь.",
            },
          })
          .catch(() => null);
      }
    }
  } else if (event.event === "payment.canceled") {
    await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } }).catch(() => null);
  }

  return new Response(null, { status: 200 });
}
