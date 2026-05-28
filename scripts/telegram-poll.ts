/**
 * Local dev: long-polling for both bots (no public HTTPS required).
 * Usage: pnpm telegram:poll
 */
import "dotenv/config";
import { createLogger, logError } from "../lib/logger-script";
import { runTelegramCommandRegistration } from "../lib/telegram/commands";
import { createSellBot } from "../lib/telegram/bots/sell";
import { createSupportBot } from "../lib/telegram/bots/support";

const log = createLogger("telegram-poll");

async function main() {
  const sellToken = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();
  const supportToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim();

  if (!sellToken && !supportToken) {
    log.error("Set TELEGRAM_SELL_BOT_TOKEN and/or TELEGRAM_SUPPORT_BOT_TOKEN");
    process.exit(1);
  }

  await runTelegramCommandRegistration();

  const runners: Promise<void>[] = [];

  if (sellToken) {
    const bot = createSellBot();
    log.info("sell bot polling");
    runners.push(bot.start({ onStart: () => log.info("sell bot ready") }));
  }

  if (supportToken) {
    const bot = createSupportBot();
    log.info("support bot polling");
    runners.push(bot.start({ onStart: () => log.info("support bot ready") }));
  }

  await Promise.all(runners);
}

main().catch((err) => {
  logError(log, "telegram poll failed", err);
  process.exit(1);
});
