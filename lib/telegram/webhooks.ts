import { createLogger, logError } from "@/lib/logger/core";
import { getSiteOrigin } from "@/lib/site-url";
import { telegramFetch } from "@/lib/telegram/telegram-fetch";

const log = createLogger("telegram-webhooks");
const TELEGRAM_API = "https://api.telegram.org";

export type TelegramBotLabel = "sell" | "support";

export type TelegramBotWebhookConfig = {
  label: TelegramBotLabel;
  tokenEnv: "TELEGRAM_SELL_BOT_TOKEN" | "TELEGRAM_SUPPORT_BOT_TOKEN";
  webhookPath: string;
};

export const TELEGRAM_BOT_WEBHOOKS: TelegramBotWebhookConfig[] = [
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

type TelegramApiResponse<T> = {
  ok: boolean;
  description?: string;
  result?: T;
};

type TelegramBotIdentity = {
  username?: string;
  first_name?: string;
};

type TelegramWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
};

export type TelegramBotWebhookResult = {
  label: TelegramBotLabel;
  skipped: boolean;
  ok: boolean;
  username?: string;
  url?: string;
  error?: string;
};

export type EnsureTelegramWebhooksResult = {
  ok: boolean;
  bots: TelegramBotWebhookResult[];
};

type EnsureTelegramWebhooksOptions = {
  /** Allow registration when the public origin is not HTTPS (CLI). */
  skipOriginCheck?: boolean;
  /** Always call setWebhook even when the URL already matches (CLI). */
  force?: boolean;
  /** Discard queued updates on setWebhook (use after deploy/restart to stop retry storms). */
  dropPendingUpdates?: boolean;
};

function getBotToken(config: TelegramBotWebhookConfig): string | null {
  return process.env[config.tokenEnv]?.trim() || null;
}

function getWebhookSecret(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null;
}

export const TELEGRAM_WEBHOOK_SECRET_HELP =
  "Use 1-256 characters: A-Z, a-z, 0-9, underscore, hyphen. Example: openssl rand -hex 32";

export function validateTelegramWebhookSecret(
  secret: string,
): { ok: true } | { ok: false; error: string } {
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    return {
      ok: false,
      error: `Invalid TELEGRAM_WEBHOOK_SECRET. ${TELEGRAM_WEBHOOK_SECRET_HELP}`,
    };
  }
  return { ok: true };
}

function resolveWebhookSecret(): { secret: string | null; error?: string } {
  const secret = getWebhookSecret();
  if (!secret) return { secret: null };

  const validation = validateTelegramWebhookSecret(secret);
  if (!validation.ok) {
    return { secret: null, error: validation.error };
  }

  return { secret };
}

export function shouldAutoRegisterTelegramWebhooks(): boolean {
  const override = process.env.TELEGRAM_AUTO_WEBHOOKS?.trim().toLowerCase();
  if (override === "true" || override === "1") return true;
  if (override === "false" || override === "0") return false;
  return process.env.NODE_ENV === "production";
}

export function canRegisterTelegramWebhooks(): boolean {
  return getSiteOrigin().startsWith("https://");
}

async function telegramApi<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<TelegramApiResponse<T>> {
  const init: RequestInit = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : {};

  const res = await telegramFetch(`${TELEGRAM_API}/bot${token}/${method}`, init);
  return res.json() as Promise<TelegramApiResponse<T>>;
}

async function ensureBotWebhook(
  config: TelegramBotWebhookConfig,
  options: EnsureTelegramWebhooksOptions,
): Promise<TelegramBotWebhookResult> {
  const token = getBotToken(config);
  if (!token) {
    return { label: config.label, skipped: true, ok: true };
  }

  const expectedUrl = `${getSiteOrigin()}${config.webhookPath}`;

  const me = await telegramApi<TelegramBotIdentity>(token, "getMe");
  if (!me.ok) {
    return {
      label: config.label,
      skipped: false,
      ok: false,
      error: me.description ?? "getMe failed",
    };
  }

  log.info(
    {
      label: config.label,
      username: me.result?.username,
      firstName: me.result?.first_name,
    },
    "telegram bot identity",
  );

  const webhook = await telegramApi<TelegramWebhookInfo>(token, "getWebhookInfo");
  if (!webhook.ok) {
    return {
      label: config.label,
      skipped: false,
      ok: false,
      username: me.result?.username,
      error: webhook.description ?? "getWebhookInfo failed",
    };
  }

  const info = webhook.result;
  const alreadyRegistered =
    info?.url === expectedUrl && !info.last_error_message && !options.force;

  if (alreadyRegistered) {
    log.info({ label: config.label, url: expectedUrl }, "telegram webhook already registered");
    return {
      label: config.label,
      skipped: false,
      ok: true,
      username: me.result?.username,
      url: expectedUrl,
    };
  }

  const body: Record<string, unknown> = { url: expectedUrl };
  const { secret, error: secretError } = resolveWebhookSecret();
  if (secretError) {
    return {
      label: config.label,
      skipped: false,
      ok: false,
      username: me.result?.username,
      error: secretError,
    };
  }
  if (secret) {
    body.secret_token = secret;
  }
  // Serialize deliveries on small VPS; parallel POSTs can stall nginx → Telegram timeouts.
  body.max_connections = 1;
  if (options.dropPendingUpdates) {
    body.drop_pending_updates = true;
  }

  const registered = await telegramApi<true>(token, "setWebhook", body);
  if (!registered.ok) {
    return {
      label: config.label,
      skipped: false,
      ok: false,
      username: me.result?.username,
      error: registered.description ?? "setWebhook failed",
    };
  }

  log.info({ label: config.label, url: expectedUrl }, "telegram webhook registered");
  return {
    label: config.label,
    skipped: false,
    ok: true,
    username: me.result?.username,
    url: expectedUrl,
  };
}

export async function ensureTelegramWebhooks(
  options: EnsureTelegramWebhooksOptions = {},
): Promise<EnsureTelegramWebhooksResult> {
  const configuredBots = TELEGRAM_BOT_WEBHOOKS.filter((bot) => getBotToken(bot));
  if (configuredBots.length === 0) {
    log.debug("telegram webhooks skipped — no bot tokens configured");
    return { ok: true, bots: [] };
  }

  if (!options.skipOriginCheck && !canRegisterTelegramWebhooks()) {
    log.warn(
      { siteOrigin: getSiteOrigin() },
      "telegram webhooks skipped — public origin must be HTTPS",
    );
    return {
      ok: false,
      bots: configuredBots.map((bot) => ({
        label: bot.label,
        skipped: true,
        ok: false,
        error: "Public origin must use HTTPS for Telegram webhooks",
      })),
    };
  }

  const bots = await Promise.all(
    configuredBots.map((bot) => ensureBotWebhook(bot, options)),
  );

  return {
    ok: bots.every((bot) => bot.ok || bot.skipped),
    bots,
  };
}

async function warmTelegramBots(): Promise<void> {
  const {
    ensureSellBotInitialized,
    ensureSupportBotInitialized,
    isSellBotEnabled,
    isSupportBotEnabled,
  } = await import("@/lib/telegram/bots");

  const tasks: Promise<void>[] = [];
  if (isSellBotEnabled()) tasks.push(ensureSellBotInitialized());
  if (isSupportBotEnabled()) tasks.push(ensureSupportBotInitialized());
  await Promise.all(tasks);
}

export async function runTelegramStartup(): Promise<void> {
  const { runTelegramCommandRegistration } = await import("@/lib/telegram/commands");
  await runTelegramCommandRegistration();

  try {
    await warmTelegramBots();
  } catch (err) {
    logError(log, "telegram bot warm-up failed", err);
  }

  if (!shouldAutoRegisterTelegramWebhooks()) {
    log.debug("telegram startup skipped — auto webhooks disabled for this environment");
    return;
  }

  try {
    const result = await ensureTelegramWebhooks();
    if (!result.ok) {
      log.warn({ bots: result.bots }, "telegram startup completed with warnings");
    }
  } catch (err) {
    logError(log, "telegram startup failed", err);
  }
}
