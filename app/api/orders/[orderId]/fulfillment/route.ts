import { getOrderAccessContext } from "@/lib/orders/access";
import { updateOrderFulfillment } from "@/lib/orders/fulfillment";
import db from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = new URL(req.url).searchParams.get("token");

  const access = await getOrderAccessContext(orderId, token);
  if (!access?.canManageFulfillment) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let productContent: string;
  try {
    ({ productContent } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await updateOrderFulfillment(orderId, productContent ?? "");
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      productContent: true,
      updatedAt: true,
    },
  });

  return Response.json({
    order: {
      ...order!,
      updatedAt: order!.updatedAt.toISOString(),
    },
  });
}
