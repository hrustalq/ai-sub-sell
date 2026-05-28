import db from "@/lib/db";
import { requireCoreAdminApi } from "@/lib/admin/api";
import {
  assignTelegramUserId,
  clearTelegramUserId,
} from "@/lib/telegram/support-access";
import { resolveUserPermissions } from "@/lib/rbac";

type TelegramPayload = {
  telegramUserId?: unknown;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const context = await requireCoreAdminApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { userId } = await params;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return Response.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  let body: TelegramPayload;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  if (body.telegramUserId === null || body.telegramUserId === "") {
    await clearTelegramUserId(userId);
    return Response.json({ ok: true, telegramUserId: null });
  }

  if (typeof body.telegramUserId !== "string") {
    return Response.json({ error: "telegramUserId должен быть строкой или null" }, { status: 400 });
  }

  const permissions = resolveUserPermissions(user, user.email);
  if (!permissions.canAccessSupport) {
    return Response.json(
      { error: "Telegram можно привязать только пользователю с доступом к поддержке" },
      { status: 400 },
    );
  }

  const result = await assignTelegramUserId(userId, body.telegramUserId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true, telegramUserId: body.telegramUserId.trim() });
}
