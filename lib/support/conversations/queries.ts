import "server-only";

import db from "@/lib/db";
import { getTelegramAccount } from "@/lib/telegram/accounts";
import { getUnreadCountsForSupportConversations } from "@/lib/support/conversations/read-state";

export async function getSupportConversationMessages(conversationId: string) {
  return db.supportConversationMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });
}

export async function getSupportConversations() {
  const conversations = await db.supportConversation.findMany({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    include: {
      buyerTelegram: {
        select: {
          telegramUserId: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          author: true,
          body: true,
          createdAt: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  const unreadCounts = await getUnreadCountsForSupportConversations(
    conversations.map((conversation) => conversation.id),
    "seller",
  );

  return conversations.map((conversation) => {
    const lastMessage = conversation.messages[0] ?? null;
    const unreadCount = unreadCounts.get(conversation.id) ?? 0;
    const buyerLabel =
      conversation.buyerTelegram?.firstName ||
      conversation.buyerTelegram?.username ||
      conversation.user?.name ||
      conversation.buyerEmail ||
      conversation.buyerTelegram?.email ||
      "Telegram";

    return {
      id: conversation.id,
      status: conversation.status,
      buyerEmail:
        conversation.buyerEmail ||
        conversation.buyerTelegram?.email ||
        conversation.user?.email ||
        null,
      buyerTelegramUserId: conversation.buyerTelegramUserId,
      buyerLabel,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation._count.messages,
      unreadCount,
      needsReply: unreadCount > 0,
      user: conversation.user,
      buyerTelegram: conversation.buyerTelegram,
      lastMessage,
    };
  });
}

export async function getSupportConversation(conversationId: string) {
  return db.supportConversation.findUnique({
    where: { id: conversationId },
    include: {
      buyerTelegram: {
        select: {
          telegramUserId: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getOrCreateOpenSupportConversation(telegramUserId: string) {
  const existing = await db.supportConversation.findFirst({
    where: {
      buyerTelegramUserId: telegramUserId,
      status: "OPEN",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) return existing;

  const account = await getTelegramAccount(telegramUserId);

  return db.supportConversation.create({
    data: {
      id: crypto.randomUUID(),
      buyerTelegramUserId: telegramUserId,
      buyerEmail: account?.email ?? null,
      status: "OPEN",
    },
  });
}

export async function getOpenSupportConversationForBuyer(telegramUserId: string) {
  return db.supportConversation.findFirst({
    where: {
      buyerTelegramUserId: telegramUserId,
      status: "OPEN",
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function closeSupportConversation(conversationId: string) {
  return db.supportConversation.update({
    where: { id: conversationId },
    data: { status: "CLOSED", updatedAt: new Date() },
  });
}
