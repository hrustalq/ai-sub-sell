import db from "@/lib/db";
import { getOrderAccessContext } from "@/lib/orders/access";

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

  const trimmed = productContent?.trim();
  if (!trimmed || trimmed.length > 20000) {
    return Response.json(
      { error: "Данные товара должны быть от 1 до 20000 символов" },
      { status: 400 },
    );
  }

  const order = await db.order.update({
    where: { id: orderId },
    data: { productContent: trimmed },
    select: {
      id: true,
      productContent: true,
      updatedAt: true,
    },
  });

  return Response.json({
    order: {
      ...order,
      updatedAt: order.updatedAt.toISOString(),
    },
  });
}
