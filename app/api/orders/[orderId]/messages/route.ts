import db from "@/lib/db";
import { getOrderAccessContext } from "@/lib/orders/access";
import { getOrderMessages } from "@/lib/orders/queries";
import {
  getOrderUnreadCount,
  markOrderMessagesRead,
} from "@/lib/orders/read-state";

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

  const trimmed = body?.trim();
  if (!trimmed || trimmed.length > 4000) {
    return Response.json({ error: "Сообщение должно быть от 1 до 4000 символов" }, { status: 400 });
  }

  const message = await db.orderMessage.create({
    data: {
      id: crypto.randomUUID(),
      orderId,
      author: access.authorRole,
      body: trimmed,
    },
    select: {
      id: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });

  await markOrderMessagesRead(orderId, access.authorRole);

  return Response.json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
    },
    unreadCount: 0,
  });
}
