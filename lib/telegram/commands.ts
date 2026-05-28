import { createLogger, logError } from "@/lib/logger/core";
import { getSellBotToken, getSupportBotToken } from "@/lib/telegram/config";

const log = createLogger("telegram-commands");
const TELEGRAM_API = "https://api.telegram.org";

export type TelegramBotCommand = {
  command: string;
  description: string;
};

export const SELL_BOT_COMMANDS: TelegramBotCommand[] = [
  { command: "start", description: "Начало работы" },
  { command: "catalog", description: "Каталог тарифов" },
  { command: "orders", description: "Мои заказы" },
  { command: "support", description: "Чат с поддержкой" },
  { command: "email", description: "Привязать email" },
  { command: "help", description: "Справка по командам" },
];

export const SUPPORT_BOT_COMMANDS: TelegramBotCommand[] = [
  { command: "start", description: "Начало работы" },
  { command: "orders", description: "Список заказов" },
  { command: "chats", description: "Обращения без заказа" },
  { command: "help", description: "Справка по командам" },
];

type BotCommandsConfig = {
  label: "sell" | "support";
  token: string;
  commands: TelegramBotCommand[];
};

async function setBotCommands(config: BotCommandsConfig): Promise<boolean> {
  const res = await fetch(`${TELEGRAM_API}/bot${config.token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands: config.commands }),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) {
    log.error(
      { label: config.label, description: data.description ?? data },
      "setMyCommands failed",
    );
    return false;
  }

  log.info({ label: config.label, commands: config.commands.length }, "bot commands registered");
  return true;
}

export async function registerTelegramBotCommands(): Promise<boolean> {
  const sellToken = getSellBotToken();
  const supportToken = getSupportBotToken();

  if (!sellToken && !supportToken) {
    log.debug("telegram commands skipped — no bot tokens configured");
    return true;
  }

  const tasks: Promise<boolean>[] = [];

  if (sellToken) {
    tasks.push(setBotCommands({ label: "sell", token: sellToken, commands: SELL_BOT_COMMANDS }));
  }

  if (supportToken) {
    tasks.push(
      setBotCommands({ label: "support", token: supportToken, commands: SUPPORT_BOT_COMMANDS }),
    );
  }

  const results = await Promise.all(tasks);
  return results.every(Boolean);
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
