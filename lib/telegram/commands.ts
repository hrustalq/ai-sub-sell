import { Bot } from "grammy";
import { createLogger, logError } from "@/lib/logger/core";
import { getSellBotToken } from "@/lib/telegram/config";
import { telegramBotClientConfig } from "@/lib/telegram/telegram-fetch";

const log = createLogger("telegram-commands");

export type TelegramBotCommand = {
  command: string;
  description: string;
};

/** Unified bot: buyer + staff commands (staff-only commands are gated in handlers). */
export const BOT_COMMANDS: TelegramBotCommand[] = [
  { command: "start", description: "Начало работы" },
  { command: "catalog", description: "Каталог тарифов" },
  { command: "orders", description: "Мои заказы" },
  { command: "support", description: "Чат с поддержкой" },
  { command: "email", description: "Привязать email" },
  { command: "link", description: "Привязать заказ по номеру" },
  { command: "inbox", description: "Входящие заказы (поддержка)" },
  { command: "tickets", description: "Обращения без заказа (поддержка)" },
  { command: "staff_help", description: "Справка для поддержки" },
  { command: "help", description: "Справка по командам" },
];

export async function registerBotCommands(bot: Bot): Promise<boolean> {
  try {
    await bot.api.setMyCommands(BOT_COMMANDS);
    log.info({ commands: BOT_COMMANDS.length }, "bot commands registered");
    return true;
  } catch (err) {
    logError(log, "setMyCommands failed", err);
    return false;
  }
}

export async function registerTelegramBotCommands(): Promise<boolean> {
  const token = getSellBotToken();
  if (!token) {
    log.debug("telegram commands skipped — no bot token configured");
    return true;
  }

  const bot = new Bot(token, telegramBotClientConfig);
  return registerBotCommands(bot);
}

export async function runTelegramCommandRegistration(): Promise<void> {
  try {
    const ok = await registerTelegramBotCommands();
    if (!ok) {
      log.warn("telegram command registration completed with warnings");
    }
  } catch (err) {
    logError(log, "telegram command registration failed", err);
  }
}
