import "server-only";

import db from "@/lib/db";
import { resolveUserPermissions } from "@/lib/rbac/permissions";
import { getSupportTelegramUserIds } from "@/lib/telegram/config";

export function parseTelegramUserId(
  raw: string,
): { ok: true; id: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Укажите Telegram ID" };
  }
  if (!/^\d{5,15}$/.test(trimmed)) {
    return { ok: false, error: "Telegram ID — число из 5–15 цифр без пробелов" };
  }
  return { ok: true, id: trimmed };
}

export async function getLinkedSupportTelegramUserIds(): Promise<string[]> {
  const users = await db.user.findMany({
    where: { telegramUserId: { not: null } },
    select: {
      telegramUserId: true,
      email: true,
      rbacAdmin: true,
      rbacSupport: true,
    },
  });

  return users
    .filter((user) => resolveUserPermissions(user, user.email).canAccessSupport)
    .map((user) => user.telegramUserId)
    .filter((id): id is string => Boolean(id));
}

export async function isSupportTelegramUser(
  telegramUserId: string | number,
): Promise<boolean> {
  const id = String(telegramUserId).trim();
  if (!id) return false;

  if (getSupportTelegramUserIds().includes(id)) {
    return true;
  }

  const user = await db.user.findFirst({
    where: { telegramUserId: id },
    select: {
      email: true,
      rbacAdmin: true,
      rbacSupport: true,
    },
  });

  if (!user) return false;

  return resolveUserPermissions(user, user.email).canAccessSupport;
}

export async function getSupportStaffChatIds(): Promise<string[]> {
  const telegramUserIds = [
    ...new Set([...getSupportTelegramUserIds(), ...(await getLinkedSupportTelegramUserIds())]),
  ];

  if (telegramUserIds.length === 0) return [];

  const accounts = await db.telegramAccount.findMany({
    where: { telegramUserId: { in: telegramUserIds } },
    select: { chatId: true },
  });

  return [...new Set(accounts.map((account) => account.chatId))];
}

export async function assignTelegramUserId(
  userId: string,
  telegramUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = parseTelegramUserId(telegramUserId);
  if (!parsed.ok) return parsed;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, error: "Пользователь не найден" };
  }

  const permissions = resolveUserPermissions(user, user.email);
  if (!permissions.canAccessSupport) {
    return {
      ok: false,
      error: "Telegram поддержки доступен только сотрудникам с доступом к поддержке",
    };
  }

  const taken = await db.user.findFirst({
    where: {
      telegramUserId: parsed.id,
      NOT: { id: userId },
    },
    select: { id: true },
  });
  if (taken) {
    return { ok: false, error: "Этот Telegram ID уже привязан к другому пользователю" };
  }

  const telegramAccount = await db.telegramAccount.findUnique({
    where: { telegramUserId: parsed.id },
  });
  if (!telegramAccount) {
    return {
      ok: false,
      error:
        "Сначала отправьте /start боту поддержки в Telegram — так мы подтвердим ваш аккаунт",
    };
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { telegramUserId: parsed.id },
    }),
    db.telegramAccount.update({
      where: { telegramUserId: parsed.id },
      data: { email: user.email },
    }),
  ]);

  return { ok: true };
}

export async function clearTelegramUserId(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { telegramUserId: null },
  });
}
