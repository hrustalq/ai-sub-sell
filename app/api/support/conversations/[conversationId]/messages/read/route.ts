import { requireSupportApi } from "@/lib/admin/api";
import { getSupportConversationAccessContext } from "@/lib/support/conversations/access";
import {
  getSupportConversationUnreadCount,
  markSupportConversationMessagesRead,
} from "@/lib/support/conversations/read-state";

export async function POST(
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

  await markSupportConversationMessagesRead(conversationId, access.authorRole);
  const unreadCount = await getSupportConversationUnreadCount(
    conversationId,
    access.authorRole,
  );

  return Response.json({ unreadCount });
}
