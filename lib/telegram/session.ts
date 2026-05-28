import "server-only";

import db from "@/lib/db";
import type { TelegramBotKind } from "@/lib/telegram/config";

export type SellBotState = {
  step?:
    | "idle"
    | "awaiting_email"
    | "awaiting_email_code"
    | "order_chat"
    | "general_chat"
    | "awaiting_fulfillment";
  planId?: string;
  orderId?: string;
  conversationId?: string;
  pendingEmail?: string;
};

export type SupportBotState = {
  step?: "idle" | "order_chat" | "general_chat" | "awaiting_fulfillment";
  orderId?: string;
  conversationId?: string;
};

export async function getSessionState<T extends Record<string, unknown>>(
  telegramUserId: string,
  bot: TelegramBotKind,
): Promise<T> {
  const row = await db.telegramSession.findUnique({
    where: { telegramUserId_bot: { telegramUserId, bot } },
  });
  if (!row?.state) return {} as T;
  try {
    return JSON.parse(row.state) as T;
  } catch {
    return {} as T;
  }
}

export async function setSessionState<T extends Record<string, unknown>>(
  telegramUserId: string,
  bot: TelegramBotKind,
  state: T,
): Promise<void> {
  await db.telegramSession.upsert({
    where: { telegramUserId_bot: { telegramUserId, bot } },
    create: {
      telegramUserId,
      bot,
      state: JSON.stringify(state),
    },
    update: {
      state: JSON.stringify(state),
    },
  });
}

export async function clearSessionState(
  telegramUserId: string,
  bot: TelegramBotKind,
): Promise<void> {
  await db.telegramSession.deleteMany({
    where: { telegramUserId, bot },
  });
}
