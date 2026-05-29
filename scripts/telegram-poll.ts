/**
 * Local dev: long-polling for the unified Telegram bot (no public HTTPS required).
 * Usage: pnpm telegram:poll
 */
import "./load-env";
import { createLogger, logError } from "../lib/logger-script";
import { registerBotCommands } from "../lib/telegram/commands";
import { createSellBot } from "../lib/telegram/bots/sell";

const log = createLogger("telegram-poll");

async function main() {
  const token = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();

  if (!token) {
    log.error("Set TELEGRAM_SELL_BOT_TOKEN in .env");
    process.exit(1);
  }

  const bot = createSellBot();
  await registerBotCommands(bot);
  log.info("telegram bot polling");
  await bot.start({ onStart: () => log.info("telegram bot ready") });
}

main().catch((err) => {
  logError(log, "telegram poll failed", err);
  process.exit(1);
});
