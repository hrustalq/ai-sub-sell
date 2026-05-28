import "server-only";

import type { Bot } from "grammy";
import type { Update } from "grammy/types";
import { after } from "next/server";
import { createLogger, logError } from "@/lib/logger/core";

const log = createLogger("telegram-webhook");

/**
 * Telegram must receive HTTP 2xx before handler work finishes (DB, SMTP, Bot API).
 * grammY's webhookCallback waits for the full middleware chain, which causes
 * "Connection timed out" when replies or email are slow.
 */
export function createTelegramWebhookHandler(bot: Bot, label: string) {
  return async (req: Request): Promise<Response> => {
    let update: Update;
    try {
      update = (await req.json()) as Update;
    } catch (err) {
      logError(log, "telegram webhook invalid JSON", err, { label });
      return new Response(null, { status: 400 });
    }

    if (typeof update.update_id !== "number") {
      return new Response(null, { status: 400 });
    }

    after(async () => {
      try {
        await bot.handleUpdate(update);
      } catch (err) {
        logError(log, "telegram webhook processing failed", err, {
          label,
          updateId: update.update_id,
        });
      }
    });

    return new Response(null, { status: 200 });
  };
}
