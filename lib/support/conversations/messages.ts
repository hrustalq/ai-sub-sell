import "server-only";

import db from "@/lib/db";
import type { OrderMessageAuthor } from "@/lib/orders/messages";
import { createLogger, logError } from "@/lib/logger";
import {
  notifyBuyerNewGeneralSellerMessage,
  notifySupportOfGeneralBuyerMessage,
} from "@/lib/telegram/notify";
import { markSupportConversationMessagesRead } from "@/lib/support/conversations/read-state";

const log = createLogger("support-conversation-messages");

export async function createSupportConversationMessage(params: {
  conversationId: string;
  author: OrderMessageAuthor;
  body: string;
}) {
  const trimmed = params.body.trim();
  if (!trimmed || trimmed.length > 4000) {
    return { ok: false as const, error: "Сообщение должно быть от 1 до 4000 символов" };
  }

  const conversation = await db.supportConversation.findUnique({
    where: { id: params.conversationId },
    select: {
      id: true,
      status: true,
      buyerEmail: true,
      buyerTelegramUserId: true,
    },
  });

  if (!conversation) {
    return { ok: false as const, error: "Обращение не найдено" };
  }

  if (conversation.status !== "OPEN") {
    return { ok: false as const, error: "Обращение закрыто. Начните новое: /support" };
  }

  const message = await db.supportConversationMessage.create({
    data: {
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      author: params.author,
      body: trimmed,
    },
    select: {
      id: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });

  await db.supportConversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  await markSupportConversationMessagesRead(params.conversationId, params.author);

  if (params.author === "buyer") {
    await notifySupportOfGeneralBuyerMessage({
      conversationId: params.conversationId,
      buyerEmail: conversation.buyerEmail,
      body: trimmed,
    }).catch((err) =>
      logError(log, "telegram support notify failed", err, {
        conversationId: params.conversationId,
      }),
    );
  } else if (conversation.buyerTelegramUserId) {
    await notifyBuyerNewGeneralSellerMessage({
      conversationId: params.conversationId,
      body: trimmed,
    }).catch((err) =>
      logError(log, "telegram buyer notify failed", err, {
        conversationId: params.conversationId,
      }),
    );
  }

  return { ok: true as const, message };
}
