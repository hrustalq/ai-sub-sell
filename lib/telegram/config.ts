import "server-only";

export type TelegramBotKind = "sell" | "support";

export function getSellBotToken(): string | null {
  return process.env.TELEGRAM_SELL_BOT_TOKEN?.trim() || null;
}

export function getSupportBotToken(): string | null {
  return process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim() || null;
}

export function getTelegramWebhookSecret(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null;
}

export function getSupportTelegramUserIds(): string[] {
  const raw = process.env.TELEGRAM_SUPPORT_USER_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isSupportTelegramUser(telegramUserId: string | number): boolean {
  const ids = getSupportTelegramUserIds();
  if (ids.length === 0) return false;
  return ids.includes(String(telegramUserId));
}

export function isTelegramConfigured(): boolean {
  return Boolean(getSellBotToken() || getSupportBotToken());
}
