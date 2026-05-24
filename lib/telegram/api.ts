import "server-only";

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
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
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
    console.error("[telegram] sendMessage failed", res.status, err);
    return false;
  }
  return true;
}
