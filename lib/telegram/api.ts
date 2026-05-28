import "server-only";

import { createLogger } from "@/lib/logger";
import { telegramFetch } from "@/lib/telegram/telegram-fetch";

const log = createLogger("telegram");
const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(
  token: string,
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown";
    replyMarkup?: object;
    disableWebPagePreview?: boolean;
  },
): Promise<boolean> {
  const res = await telegramFetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode,
      reply_markup: options?.replyMarkup,
      disable_web_page_preview: options?.disableWebPagePreview ?? true,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    log.error({ status: res.status, response: err, chatId }, "sendMessage failed");
    return false;
  }
  return true;
}
