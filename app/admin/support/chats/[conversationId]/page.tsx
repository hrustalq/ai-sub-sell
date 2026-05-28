import { notFound } from "next/navigation";
import {
  getSupportConversation,
  getSupportConversationMessages,
  getSupportConversationUnreadCount,
  markSupportConversationMessagesRead,
} from "@/lib/support/conversations";
import { requireSupport } from "@/lib/admin";
import { routes } from "@/lib/routes";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { SupportConversationView } from "@/app/admin/_components/support-conversation-view";

export default async function AdminSupportConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  await requireSupport();
  const { conversationId } = await params;

  const conversation = await getSupportConversation(conversationId);
  if (!conversation || conversation.status !== "OPEN") notFound();

  const [messages, unreadCount] = await Promise.all([
    getSupportConversationMessages(conversationId),
    getSupportConversationUnreadCount(conversationId, "seller"),
  ]);

  await markSupportConversationMessagesRead(conversationId, "seller");

  const buyerLabel =
    conversation.buyerTelegram?.firstName ||
    conversation.buyerTelegram?.username ||
    conversation.user?.name ||
    conversation.buyerEmail ||
    conversation.buyerTelegram?.email ||
    "Telegram";

  return (
    <AdminPageShell
      fill
      backHref={routes.admin.supportChats}
      backLabel="← К обращениям"
      title={buyerLabel}
      description={`№ ${conversation.id}`}
    >
      <SupportConversationView
        conversation={{
          id: conversation.id,
          status: conversation.status,
          buyerEmail: conversation.buyerEmail,
          buyerTelegramUserId: conversation.buyerTelegramUserId,
          buyerLabel,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          user: conversation.user,
          buyerTelegram: conversation.buyerTelegram,
        }}
        initialMessages={messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        }))}
        initialUnreadCount={unreadCount}
      />
    </AdminPageShell>
  );
}
