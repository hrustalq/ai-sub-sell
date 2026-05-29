/**
 * Register Telegram webhook for the unified bot.
 * Usage: pnpm telegram:webhooks
 */
import "./load-env";
import { createLogger, logError } from "../lib/logger-script";
import { runTelegramCommandRegistration } from "../lib/telegram/commands";
import { ensureTelegramWebhooks } from "../lib/telegram/webhooks";

const log = createLogger("telegram-webhooks");

async function main() {
  await runTelegramCommandRegistration();

  const result = await ensureTelegramWebhooks({
    skipOriginCheck: true,
    force: true,
    dropPendingUpdates: true,
  });

  if (result.bots.length === 0) {
    log.error("Set TELEGRAM_SELL_BOT_TOKEN");
    process.exit(1);
  }

  for (const bot of result.bots) {
    if (!bot.ok) {
      log.error({ label: bot.label, error: bot.error }, "webhook registration failed");
    }
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  logError(log, "telegram webhooks setup failed", err);
  process.exit(1);
});
