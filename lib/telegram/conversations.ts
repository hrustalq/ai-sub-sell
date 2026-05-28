import "server-only";

import {
  createSupportConversationMessage,
  getOpenSupportConversationForBuyer,
  getOrCreateOpenSupportConversation,
  getSupportConversationMessages,
} from "@/lib/support/conversations";

export async function getBuyerGeneralChatMessages(conversationId: string) {
  return getSupportConversationMessages(conversationId);
}

export async function postBuyerGeneralMessage(
  telegramUserId: string,
  conversationId: string,
  body: string,
) {
  const conversation = await getOpenSupportConversationForBuyer(telegramUserId);
  if (!conversation || conversation.id !== conversationId) {
    return { ok: false as const, error: "Обращение не найдено" };
  }

  return createSupportConversationMessage({
    conversationId,
    author: "buyer",
    body,
  });
}

export async function postSellerGeneralMessage(conversationId: string, body: string) {
  return createSupportConversationMessage({
    conversationId,
    author: "seller",
    body,
  });
}

export async function ensureBuyerGeneralConversation(telegramUserId: string) {
  return getOrCreateOpenSupportConversation(telegramUserId);
}
