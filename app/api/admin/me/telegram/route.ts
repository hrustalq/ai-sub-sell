import db from "@/lib/db";
import { requireSupportApi } from "@/lib/admin/api";
import {
  assignTelegramUserId,
  clearTelegramUserId,
} from "@/lib/telegram/support-access";

type TelegramPayload = {
  telegramUserId?: unknown;
};

export async function GET() {
  const context = await requireSupportApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: context.session.user.id },
    select: { telegramUserId: true },
  });

  return Response.json({
    telegramUserId: user?.telegramUserId ?? null,
  });
}

export async function PATCH(req: Request) {
  const context = await requireSupportApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let body: TelegramPayload;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const userId = context.session.user.id;

  if (body.telegramUserId === null || body.telegramUserId === "") {
    await clearTelegramUserId(userId);
    return Response.json({ ok: true, telegramUserId: null });
  }

  if (typeof body.telegramUserId !== "string") {
    return Response.json({ error: "telegramUserId должен быть строкой или null" }, { status: 400 });
  }

  const result = await assignTelegramUserId(userId, body.telegramUserId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, telegramUserId: body.telegramUserId.trim() });
}
