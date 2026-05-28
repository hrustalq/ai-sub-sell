import { createLogger, logError } from "@/lib/logger/core";
import type { Bot } from "grammy";

const log = createLogger("telegram-bot");

export function catchBotErrors(bot: Bot, label: string): void {
  bot.catch((err) => {
    logError(log, `${label} bot handler failed`, err.error, {
      updateId: err.ctx.update.update_id,
    });
  });
}
