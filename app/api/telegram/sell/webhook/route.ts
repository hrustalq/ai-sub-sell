import { webhookCallback } from "grammy/web";
import {
  getSellBot,
  isSellBotEnabled,
  verifyTelegramWebhookSecret,
} from "@/lib/telegram/bots";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSellBotEnabled()) {
    return new Response(null, { status: 503 });
  }
  if (!verifyTelegramWebhookSecret(req)) {
    return new Response(null, { status: 401 });
  }
  return webhookCallback(getSellBot(), "std/http")(req);
}
