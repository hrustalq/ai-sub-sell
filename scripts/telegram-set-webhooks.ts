/**
 * Register Telegram webhooks for sell and support bots.
 * Usage: pnpm telegram:webhooks
 */
import "dotenv/config";
import { createLogger, logError } from "../lib/logger-script";
import { getSiteOrigin } from "../lib/site-url";

const log = createLogger("telegram-webhooks");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

async function setWebhook(token: string, path: string, label: string) {
  const url = `${getSiteOrigin()}${path}`;
  const body: Record<string, unknown> = { url };
  if (secret) {
    body.secret_token = secret;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    log.error({ label, data }, "setWebhook failed");
    process.exitCode = 1;
    return;
  }
  log.info({ label, url }, "webhook registered");
}

async function main() {
  const sell = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();
  const support = process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim();

  if (!sell && !support) {
    log.error("Set TELEGRAM_SELL_BOT_TOKEN and/or TELEGRAM_SUPPORT_BOT_TOKEN");
    process.exit(1);
  }

  if (sell) {
    await setWebhook(sell, "/api/telegram/sell/webhook", "sell");
  }
  if (support) {
    await setWebhook(support, "/api/telegram/support/webhook", "support");
  }
}

main().catch((err) => {
  logError(log, "telegram webhooks setup failed", err);
  process.exit(1);
});
