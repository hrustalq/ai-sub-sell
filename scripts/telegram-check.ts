/**
 * Verify Telegram bot tokens, webhook URLs, and env configuration.
 * Usage: pnpm telegram:check
 */
import "dotenv/config";
import { getSiteOrigin } from "../lib/site-url";

type BotCheck = {
  label: string;
  tokenEnv: string;
  webhookPath: string;
};

const BOTS: BotCheck[] = [
  {
    label: "sell",
    tokenEnv: "TELEGRAM_SELL_BOT_TOKEN",
    webhookPath: "/api/telegram/sell/webhook",
  },
  {
    label: "support",
    tokenEnv: "TELEGRAM_SUPPORT_BOT_TOKEN",
    webhookPath: "/api/telegram/support/webhook",
  },
];

async function telegramApi<T>(token: string, method: string): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`);
  return res.json() as Promise<T>;
}

async function checkBot(bot: BotCheck): Promise<boolean> {
  const token = process.env[bot.tokenEnv]?.trim();
  if (!token) {
    console.log(`[${bot.label}] SKIP — ${bot.tokenEnv} not set`);
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
    console.error(`[${bot.label}] getMe FAILED:`, me.description ?? me);
    return false;
  }

  console.log(
    `[${bot.label}] bot @${me.result?.username ?? "?"} (${me.result?.first_name ?? "?"})`,
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
    console.error(`[${bot.label}] getWebhookInfo FAILED:`, webhook.description ?? webhook);
    return false;
  }

  const info = webhook.result;
  if (!info?.url) {
    console.warn(`[${bot.label}] webhook NOT SET (use pnpm telegram:webhooks or pnpm telegram:poll locally)`);
    ok = false;
  } else if (info.url !== expectedUrl) {
    console.warn(`[${bot.label}] webhook URL mismatch`);
    console.warn(`  expected: ${expectedUrl}`);
    console.warn(`  actual:   ${info.url}`);
    ok = false;
  } else {
    console.log(`[${bot.label}] webhook OK → ${info.url}`);
  }

  if (info?.pending_update_count) {
    console.warn(`[${bot.label}] pending updates: ${info.pending_update_count}`);
  }

  if (info?.last_error_message) {
    const when = info.last_error_date
      ? new Date(info.last_error_date * 1000).toISOString()
      : "unknown";
    console.error(`[${bot.label}] last webhook error (${when}): ${info.last_error_message}`);
    ok = false;
  }

  return ok;
}

async function main() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const supportIds = process.env.TELEGRAM_SUPPORT_USER_IDS?.trim();

  console.log(`Site origin: ${getSiteOrigin()}`);
  console.log(`Webhook secret: ${secret ? "set" : "not set (webhooks accept any request)"}`);
  console.log(`Support user IDs: ${supportIds || "not set"}`);
  console.log("");

  const sellToken = process.env.TELEGRAM_SELL_BOT_TOKEN?.trim();
  const supportToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN?.trim();

  if (!sellToken && !supportToken) {
    console.error("Set TELEGRAM_SELL_BOT_TOKEN and/or TELEGRAM_SUPPORT_BOT_TOKEN in .env");
    process.exit(1);
  }

  if (supportToken && !supportIds) {
    console.warn("WARNING: support bot token set but TELEGRAM_SUPPORT_USER_IDS is empty — nobody can use it");
  }

  const results = await Promise.all(BOTS.map(checkBot));
  if (!results.every(Boolean)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
