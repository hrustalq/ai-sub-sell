import "server-only";

import type { Bot } from "grammy";
import { createSellBot } from "@/lib/telegram/bots/sell";
import { createSupportBot } from "@/lib/telegram/bots/support";
import {
  getSellBotToken,
  getSupportBotToken,
  getTelegramWebhookSecret,
} from "@/lib/telegram/config";

let sellBot: Bot | null = null;
let supportBot: Bot | null = null;

const initPromises = new WeakMap<Bot, Promise<void>>();

/** grammY requires init() before handleUpdate; webhookCallback did this implicitly. */
export function ensureBotInitialized(bot: Bot): Promise<void> {
  const pending = initPromises.get(bot);
  if (pending) return pending;

  const promise = bot.init().catch((err) => {
    initPromises.delete(bot);
    throw err;
  });
  initPromises.set(bot, promise);
  return promise;
}

export function getSellBot(): Bot {
  if (!sellBot) {
    sellBot = createSellBot();
  }
  return sellBot;
}

export function getSupportBot(): Bot {
  if (!supportBot) {
    supportBot = createSupportBot();
  }
  return supportBot;
}

export function verifyTelegramWebhookSecret(req: Request): boolean {
  const secret = getTelegramWebhookSecret();
  if (!secret) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export function isSellBotEnabled(): boolean {
  return Boolean(getSellBotToken());
}

export function isSupportBotEnabled(): boolean {
  return Boolean(getSupportBotToken());
}

export function ensureSellBotInitialized(): Promise<void> {
  return ensureBotInitialized(getSellBot());
}

export function ensureSupportBotInitialized(): Promise<void> {
  return ensureBotInitialized(getSupportBot());
}
