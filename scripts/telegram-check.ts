/**
 * Verify Telegram bot tokens, webhook URLs, and env configuration.
 * Usage: pnpm telegram:check
 */
import "dotenv/config";
import { createLogger, logError } from "../lib/logger-script";
import { getSiteOrigin } from "../lib/site-url";
import {
  TELEGRAM_BOT_WEBHOOKS,
  type TelegramBotWebhookConfig,
} from "../lib/telegram/webhooks";

const log = createLogger("telegram-check");

async function telegramApi<T>(token: string, method: string): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`);
  return res.json() as Promise<T>;
}

async function checkBot(bot: TelegramBotWebhookConfig): Promise<boolean> {
  const token = process.env[bot.tokenEnv]?.trim();
  if (!token) {
    log.info({ label: bot.label, env: bot.tokenEnv }, "bot skipped — token not set");
    return true;
  }

  const expectedUrl = `${getSiteOrigin()}${bot.webhookPath}`;
  let ok = true;

  const me = await telegramApi<{
    ok: boolean;
    description?: string;
    result?: { username?: string; first_name?: string };
  }>(token, "getMe");

  if (!me.ok) {
    log.error({ label: bot.label, description: me.description ?? me }, "getMe failed");
    return false;
  }

  log.info(
    {
      label: bot.label,
      username: me.result?.username,
      firstName: me.result?.first_name,
    },
    "bot identity",
  );

  const webhook = await telegramApi<{
    ok: boolean;
    description?: string;
    result?: {
      url?: string;
      has_custom_certificate?: boolean;
      pending_update_count?: number;
      last_error_date?: number;
      last_error_message?: string;
    };
  }>(token, "getWebhookInfo");

  if (!webhook.ok) {
    log.error(
      { label: bot.label, description: webhook.description ?? webhook },
      "getWebhookInfo failed",
    );
    return false;
  }

  const info = webhook.result;
  if (!info?.url) {
    log.warn(
      { label: bot.label },
      "webhook not set (use pnpm telegram:webhooks, restart production server, or pnpm telegram:poll locally)",
    );
    ok = false;
  } else if (info.url !== expectedUrl) {
    log.warn(
      { label: bot.label, expectedUrl, actualUrl: info.url },
      "webhook URL mismatch",
    );
    ok = false;
  } else {
    log.info({ label: bot.label, url: info.url }, "webhook OK");
  }

  if (info?.pending_update_count) {
    log.warn({ label: bot.label, count: info.pending_update_count }, "pending updates");
  }

  if (info?.last_error_message) {
    const when = info.last_error_date
      ? new Date(info.last_error_date * 1000).toISOString()
      : "unknown";
    log.error(
      { label: bot.label, when, message: info.last_error_message },
      "last webhook error",
    );
    ok = false;
  }

  return ok;
}

async function main() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const supportIds = process.env.TELEGRAM_SUPPORT_USER_IDS?.trim();

  log.info(
    {
      siteOrigin: getSiteOrigin(),
      webhookSecret: secret ? "set" : "not set (webhooks accept any request)",
      supportUserIds: supportIds || "not set",
    },
    "telegram check configuration",
  );

  const sellToken = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();
  const supportToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim();

  if (!sellToken && !supportToken) {
    log.error("Set TELEGRAM_SELL_BOT_TOKEN and/or TELEGRAM_SUPPORT_BOT_TOKEN in .env");
    process.exit(1);
  }

  if (supportToken && !supportIds) {
    log.warn(
      "support bot token set but TELEGRAM_SUPPORT_USER_IDS is empty — link staff Telegram IDs in admin panel (Админ → Telegram)",
    );
  }

  const results = await Promise.all(TELEGRAM_BOT_WEBHOOKS.map(checkBot));
  if (!results.every(Boolean)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  logError(log, "telegram check failed", err);
  process.exit(1);
});
