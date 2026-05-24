/**
 * Local dev: long-polling for both bots (no public HTTPS required).
 * Usage: pnpm telegram:poll
 */
import "dotenv/config";
import { createSellBot } from "../lib/telegram/bots/sell";
import { createSupportBot } from "../lib/telegram/bots/support";

async function main() {
  const sellToken = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();
  const supportToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim();

  if (!sellToken && !supportToken) {
    console.error("Set TELEGRAM_SELL_BOT_TOKEN and/or TELEGRAM_SUPPORT_BOT_TOKEN");
    process.exit(1);
  }

  const runners: Promise<void>[] = [];

  if (sellToken) {
    const bot = createSellBot();
    console.log("[sell] polling…");
    runners.push(bot.start({ onStart: () => console.log("[sell] ready") }));
  }

  if (supportToken) {
    const bot = createSupportBot();
    console.log("[support] polling…");
    runners.push(bot.start({ onStart: () => console.log("[support] ready") }));
  }

  await Promise.all(runners);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
