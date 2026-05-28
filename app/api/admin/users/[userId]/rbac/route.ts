import db from "@/lib/db";
import { requireCoreAdminApi } from "@/lib/admin/api";
import { isCoreAdminEmail } from "@/lib/rbac";

type RbacPayload = {
  rbacAdmin?: unknown;
  rbacSupport?: unknown;
};

function parseRbacPayload(body: RbacPayload) {
  if (typeof body.rbacAdmin !== "boolean" || typeof body.rbacSupport !== "boolean") {
    return { error: "rbacAdmin и rbacSupport должны быть boolean" } as const;
  }
  return {
    value: {
      rbacAdmin: body.rbacAdmin,
      rbacSupport: body.rbacSupport,
    },
  } as const;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const context = await requireCoreAdminApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { userId } = await params;
  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return Response.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (isCoreAdminEmail(existing.email)) {
    return Response.json(
      { error: "Права core admin нельзя изменить через интерфейс" },
      { status: 403 },
    );
  }

  let body: RbacPayload;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const parsed = parseRbacPayload(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: parsed.value,
    select: {
      id: true,
      rbacAdmin: true,
      rbacSupport: true,
    },
  });

  return Response.json({ user });
}
