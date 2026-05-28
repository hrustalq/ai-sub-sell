import { requireSupportApi } from "@/lib/admin/api";
import { getSupportConversationAccessContext } from "@/lib/support/conversations/access";
import { createSupportConversationMessage } from "@/lib/support/conversations/messages";
import { getSupportConversationMessages } from "@/lib/support/conversations/queries";
import { getSupportConversationUnreadCount } from "@/lib/support/conversations/read-state";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const context = await requireSupportApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { conversationId } = await params;
  const access = await getSupportConversationAccessContext(conversationId);
  if (!access) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const [messages, unreadCount] = await Promise.all([
    getSupportConversationMessages(conversationId),
    getSupportConversationUnreadCount(conversationId, access.authorRole),
  ]);

  return Response.json({
    messages: messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const context = await requireSupportApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { conversationId } = await params;
  const access = await getSupportConversationAccessContext(conversationId);
  if (!access) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let body: string;
  try {
    ({ body } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await createSupportConversationMessage({
    conversationId,
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
