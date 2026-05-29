/**
 * Verify Telegram bot tokens, webhook URLs, and env configuration.
 * Usage: pnpm telegram:check
 */
import "./load-env";
import { createLogger, logError } from "../lib/logger-script";
import { getSiteOrigin } from "../lib/site-url";
import {
  TELEGRAM_BOT_WEBHOOKS,
  TELEGRAM_WEBHOOK_SECRET_HELP,
  type TelegramBotWebhookConfig,
  validateTelegramWebhookSecret,
} from "../lib/telegram/webhooks";
import { telegramFetch } from "../lib/telegram/telegram-fetch";

const log = createLogger("telegram-check");
const TELEGRAM_API = "https://api.telegram.org";

async function telegramApi<T>(token: string, method: string): Promise<T> {
  const res = await telegramFetch(`${TELEGRAM_API}/bot${token}/${method}`);
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
    const errorAt = info.last_error_date ? info.last_error_date * 1000 : 0;
    const when = errorAt ? new Date(errorAt).toISOString() : "unknown";
    const ageMs = errorAt ? Date.now() - errorAt : 0;
    const staleErrorMs = 15 * 60 * 1000;
    const stale = ageMs > staleErrorMs;
    const logFn = stale ? log.warn.bind(log) : log.error.bind(log);
    logFn(
      { label: bot.label, when, message: info.last_error_message, stale },
      stale ? "last webhook error (stale)" : "last webhook error",
    );
    if (!stale) {
      ok = false;
    }
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

  if (secret) {
    const validation = validateTelegramWebhookSecret(secret);
    if (!validation.ok) {
      log.error({ help: TELEGRAM_WEBHOOK_SECRET_HELP }, validation.error);
      process.exitCode = 1;
    }
  }

  const sellToken = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();

  if (!sellToken) {
    log.error("Set TELEGRAM_SELL_BOT_TOKEN in .env");
    process.exit(1);
  }

  if (!supportIds) {
    log.warn(
      "TELEGRAM_SUPPORT_USER_IDS is empty — link staff Telegram IDs in admin panel (Админ → Telegram)",
    );
  }

  const results: boolean[] = [];
  for (const bot of TELEGRAM_BOT_WEBHOOKS) {
    results.push(await checkBot(bot));
  }
  if (!results.every(Boolean)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  logError(log, "telegram check failed", err);
  process.exit(1);
});
