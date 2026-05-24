import "server-only";

import type { User as TelegramUser } from "grammy/types";
import db from "@/lib/db";
import { isValidEmail } from "@/lib/orders/access";
import { normalizeEmail } from "@/lib/users/placeholder";

export async function upsertTelegramAccount(from: TelegramUser, chatId: number | string) {
  const telegramUserId = String(from.id);
  return db.telegramAccount.upsert({
    where: { telegramUserId },
    create: {
      telegramUserId,
      chatId: String(chatId),
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    },
    update: {
      chatId: String(chatId),
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    },
  });
}

export async function getTelegramAccount(telegramUserId: string) {
  return db.telegramAccount.findUnique({ where: { telegramUserId } });
}

export async function setTelegramAccountEmail(
  telegramUserId: string,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { ok: false, error: "Укажите корректный email" };
  }

  await db.telegramAccount.update({
    where: { telegramUserId },
    data: { email: normalized },
  });

  return { ok: true };
}

export async function resolveBuyerEmailForTelegram(
  telegramUserId: string,
  fallbackEmail?: string,
): Promise<string | null> {
  const account = await getTelegramAccount(telegramUserId);
  if (account?.email) return account.email;
  if (fallbackEmail && isValidEmail(fallbackEmail)) {
    return normalizeEmail(fallbackEmail);
  }
  return null;
}
