import { getSupportConversations } from "@/lib/support/conversations";
import type { SupportConversationRecord } from "@/lib/support/types";
import { requireSupport } from "@/lib/admin";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { SupportConversationsTable } from "@/app/admin/_components/support-conversations-table";

export default async function AdminSupportChatsPage() {
  await requireSupport();
  const conversations = await getSupportConversations();

  const data: SupportConversationRecord[] = conversations.map((conversation) => ({
    id: conversation.id,
    status: conversation.status,
    buyerEmail: conversation.buyerEmail,
    buyerTelegramUserId: conversation.buyerTelegramUserId,
    buyerLabel: conversation.buyerLabel,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messageCount: conversation.messageCount,
    unreadCount: conversation.unreadCount,
    needsReply: conversation.needsReply,
    user: conversation.user,
    buyerTelegram: conversation.buyerTelegram,
    lastMessage: conversation.lastMessage
      ? { ...conversation.lastMessage, createdAt: conversation.lastMessage.createdAt.toISOString() }
      : null,
  }));

  return (
    <AdminPageShell
      fill
      title="Обращения"
      description="Общие чаты с покупателями, не привязанные к заказам"
    >
      <SupportConversationsTable data={data} />
    </AdminPageShell>
  );
}
