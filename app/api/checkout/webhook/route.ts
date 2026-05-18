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
    await db.order.update({ where: { id: orderId }, data: { status: "PAID" } }).catch(() => null);
  } else if (event.event === "payment.canceled") {
    await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } }).catch(() => null);
  }

  return new Response(null, { status: 200 });
}
