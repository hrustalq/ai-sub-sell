import db from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { mapProviderRow } from "@/lib/plans/providers";
import { parseProviderInput } from "@/lib/plans";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const parsed = parseProviderInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await db.planProvider.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Провайдер не найден" }, { status: 404 });
  }

  const row = await db.planProvider.update({
    where: { id },
    data: {
      label: parsed.label,
      description: parsed.description,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
    },
  });

  return Response.json({ provider: mapProviderRow(row) });
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await db.planProvider.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Провайдер не найден" }, { status: 404 });
  }

  const planCount = await db.plan.count({ where: { provider: id } });
  if (planCount > 0) {
    return Response.json(
      {
        error: `Нельзя удалить провайдера: к нему привязано ${planCount} тариф(ов). Отключите провайдера или удалите тарифы.`,
      },
      { status: 409 },
    );
  }

  await db.planProvider.delete({ where: { id } });
  return Response.json({ ok: true });
}
