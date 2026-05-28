import "server-only";

import db from "@/lib/db";
import type { MessageViewer } from "@/lib/orders/read-state";

function oppositeAuthor(viewer: MessageViewer): string {
  return viewer === "buyer" ? "seller" : "buyer";
}

export async function markSupportConversationMessagesRead(
  conversationId: string,
  viewer: MessageViewer,
): Promise<void> {
  await db.supportConversationMessageRead.upsert({
    where: {
      conversationId_viewer: { conversationId, viewer },
    },
    create: {
      conversationId,
      viewer,
      readAt: new Date(),
    },
    update: {
      readAt: new Date(),
    },
  });
}

export async function getSupportConversationUnreadCount(
  conversationId: string,
  viewer: MessageViewer,
): Promise<number> {
  const counts = await getUnreadCountsForSupportConversations([conversationId], viewer);
  return counts.get(conversationId) ?? 0;
}

export async function getUnreadCountsForSupportConversations(
  conversationIds: string[],
  viewer: MessageViewer,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (conversationIds.length === 0) return result;

  for (const conversationId of conversationIds) {
    result.set(conversationId, 0);
  }

  const readStates = await db.supportConversationMessageRead.findMany({
    where: {
      conversationId: { in: conversationIds },
      viewer,
    },
    select: { conversationId: true, readAt: true },
  });

  const readAtByConversation = new Map(
    readStates.map((state) => [state.conversationId, state.readAt]),
  );

  const incoming = await db.supportConversationMessage.findMany({
    where: {
      conversationId: { in: conversationIds },
      author: oppositeAuthor(viewer),
    },
    select: { conversationId: true, createdAt: true },
  });

  for (const message of incoming) {
    const readAt = readAtByConversation.get(message.conversationId) ?? new Date(0);
    if (message.createdAt > readAt) {
      result.set(
        message.conversationId,
        (result.get(message.conversationId) ?? 0) + 1,
      );
    }
  }

  return result;
}

export async function getTotalSupportConversationUnreadCount(
  viewer: MessageViewer,
): Promise<number> {
  const incoming = await db.supportConversationMessage.findMany({
    where: { author: oppositeAuthor(viewer) },
    select: { conversationId: true, createdAt: true },
  });

  if (incoming.length === 0) return 0;

  const conversationIds = [...new Set(incoming.map((message) => message.conversationId))];
  const counts = await getUnreadCountsForSupportConversations(conversationIds, viewer);

  let total = 0;
  for (const count of counts.values()) {
    total += count;
  }
  return total;
}
