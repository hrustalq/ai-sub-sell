import { webhookCallback } from "grammy/web";
import {
  getSupportBot,
  isSupportBotEnabled,
  verifyTelegramWebhookSecret,
} from "@/lib/telegram/bots";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSupportBotEnabled()) {
    return new Response(null, { status: 503 });
  }
  if (!verifyTelegramWebhookSecret(req)) {
    return new Response(null, { status: 401 });
  }
  return webhookCallback(getSupportBot(), "std/http")(req);
}
