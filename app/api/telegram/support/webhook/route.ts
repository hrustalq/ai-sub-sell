import {
  getSupportBot,
  isSupportBotEnabled,
  verifyTelegramWebhookSecret,
} from "@/lib/telegram/bots";
import { createTelegramWebhookHandler } from "@/lib/telegram/webhook-handler";

export const runtime = "nodejs";

const handleWebhook = createTelegramWebhookHandler(getSupportBot(), "support");

export async function POST(req: Request) {
  if (!isSupportBotEnabled()) {
    return new Response(null, { status: 503 });
  }
  if (!verifyTelegramWebhookSecret(req)) {
    return new Response(null, { status: 401 });
  }
  return handleWebhook(req);
}
