import { getOrderAccessContext } from "@/lib/orders/access";
import { createOrderMessage } from "@/lib/orders/messages";
import { getOrderMessages } from "@/lib/orders/queries";
import { getOrderUnreadCount } from "@/lib/orders/read-state";

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

  const [messages, unreadCount] = await Promise.all([
    getOrderMessages(orderId),
    getOrderUnreadCount(orderId, access.authorRole),
  ]);

  return Response.json({
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

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

  let body: string;
  try {
    ({ body } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await createOrderMessage({
    orderId,
    author: access.authorRole,
    body: body ?? "",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({
    message: {
      ...result.message,
      createdAt: result.message.createdAt.toISOString(),
    },
    unreadCount: 0,
  });
}
