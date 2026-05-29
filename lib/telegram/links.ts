import "server-only";

import { buildTelegramOrderStartPayload } from "@/lib/telegram/link-order";

/** Public @username without leading @ (set TELEGRAM_BOT_USERNAME in env). */
export function getTelegramBotUsername(): string | null {
  const raw = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return raw || null;
}

export function getTelegramBotLabel(): string {
  const username = getTelegramBotUsername();
  return username ? `@${username}` : "Telegram-бот";
}

export function getTelegramBotUrl(startPayload?: string): string | null {
  const username = getTelegramBotUsername();
  if (!username) return null;
  const base = `https://t.me/${username}`;
  if (!startPayload) return base;
  return `${base}?start=${encodeURIComponent(startPayload)}`;
}

export function getTelegramOrderDeepLink(orderId: string): string | null {
  return getTelegramBotUrl(buildTelegramOrderStartPayload(orderId));
}
