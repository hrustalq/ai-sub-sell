import db from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import {
  getPlanById,
  mapPlanRow,
  parsePlanInput,
  planToDbRecord,
  type PlanInput,
} from "@/lib/plans";

function toPlanData(input: PlanInput, id: string) {
  return {
    id,
    name: input.name,
    price: input.price,
    currency: input.currency,
    period: input.period,
    limits: input.limits,
    tag: input.tag,
    badge: input.badge,
    highlight: input.highlight,
    active: input.active,
    sortOrder: input.sortOrder,
    provider: input.provider,
    tier: input.tier,
    tierLabel: input.tierLabel,
    durationMonths: input.durationMonths,
    compareAtPrice: input.compareAtPrice,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await params;
  const plan = await getPlanById(id);
  if (!plan) {
    return Response.json({ error: "Тариф не найден" }, { status: 404 });
  }

  return Response.json({ plan });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.plan.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Тариф не найден" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const parsed = parsePlanInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const provider = await db.planProvider.findUnique({ where: { id: parsed.provider } });
  if (!provider) {
    return Response.json({ error: "Провайдер не найден" }, { status: 400 });
  }

  const { id: planRecordId, ...data } = planToDbRecord(toPlanData(parsed, id));
  const row = await db.plan.update({ where: { id: planRecordId }, data });

  return Response.json({ plan: mapPlanRow(row) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.plan.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Тариф не найден" }, { status: 404 });
  }

  const ordersCount = await db.order.count({ where: { planId: id } });
  if (ordersCount > 0) {
    return Response.json(
      {
        error: `Нельзя удалить тариф: есть ${ordersCount} заказ(ов). Отключите тариф вместо удаления.`,
      },
      { status: 409 },
    );
  }

  await db.plan.delete({ where: { id } });
  return Response.json({ ok: true });
}
