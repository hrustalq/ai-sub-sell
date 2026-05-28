import "server-only";

import { webhookCallback } from "grammy/web";
import type { Bot } from "grammy";
import { createLogger, logError } from "@/lib/logger/core";

const log = createLogger("telegram-webhook");

/** Telegram allows ~60s; grammY defaults to 10s which is too tight for DB + email flows. */
const WEBHOOK_TIMEOUT_MS = 55_000;

export function createTelegramWebhookHandler(bot: Bot, label: string) {
  const handle = webhookCallback(bot, "std/http", {
    timeoutMilliseconds: WEBHOOK_TIMEOUT_MS,
  });

  return async (req: Request): Promise<Response> => {
    try {
      return await handle(req);
    } catch (err) {
      logError(log, "telegram webhook request failed", err, { label });
      // Acknowledge to stop Telegram retry storms; the error is logged for investigation.
      return new Response(null, { status: 200 });
    }
  };
}
