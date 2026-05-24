import { getOrderAccessContext } from "@/lib/orders/access";
import { getOrderUnreadCount, markOrderMessagesRead } from "@/lib/orders/read-state";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = new URL(req.url).searchParams.get("token");

  const access = await getOrderAccessContext(orderId, token);
  if (!access) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  await markOrderMessagesRead(orderId, access.authorRole);
  const unreadCount = await getOrderUnreadCount(orderId, access.authorRole);

  return Response.json({ unreadCount });
}
