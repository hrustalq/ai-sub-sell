import "server-only";

import type { Bot } from "grammy";
import type { Update } from "grammy/types";
import { ensureBotInitialized } from "@/lib/telegram/bots";
import { createLogger, logError } from "@/lib/logger/core";

const log = createLogger("telegram-webhook");

/**
 * Telegram must get HTTP 2xx and a closed connection before slow work (DB, SMTP, Bot API).
 * Do not use Next.js after() here — nginx may keep the upstream socket open until it finishes,
 * which still looks like "Connection timed out" to Telegram.
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

    void processTelegramUpdate(bot, label, update);

    return new Response(null, {
      status: 200,
      headers: { Connection: "close" },
    });
  };
}

function processTelegramUpdate(bot: Bot, label: string, update: Update): void {
  void (async () => {
    try {
      await ensureBotInitialized(bot);
      await bot.handleUpdate(update);
    } catch (err) {
      logError(log, "telegram webhook processing failed", err, {
        label,
        updateId: update.update_id,
      });
    }
  })();
}
