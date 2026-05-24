import { getOrderAccessContext } from "@/lib/orders/access";
import { getOrderForBuyerPage } from "@/lib/orders/queries";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = new URL(req.url).searchParams.get("token");

  const access = await getOrderAccessContext(orderId, token);
  if (!access) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const order = await getOrderForBuyerPage(orderId);
  if (!order) {
    return Response.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return Response.json({
    order: {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    },
    access: {
      canManageFulfillment: access.canManageFulfillment,
      authorRole: access.authorRole,
    },
  });
}
