import db from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { getAdminPlanGroups } from "@/lib/admin/plans";
import {
  mapPlanRow,
  parsePlanInput,
  planToDbRecord,
  type PlanInput,
} from "@/lib/plans";

function toPlanData(input: PlanInput) {
  return {
    id: input.id!,
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

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const groups = await getAdminPlanGroups();
  return Response.json({ groups });
}

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
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

  if (!parsed.id) {
    return Response.json({ error: "Укажите ID тарифа" }, { status: 400 });
  }

  const existing = await db.plan.findUnique({ where: { id: parsed.id } });
  if (existing) {
    return Response.json({ error: "Тариф с таким ID уже существует" }, { status: 409 });
  }

  const row = await db.plan.create({
    data: planToDbRecord(toPlanData(parsed)),
  });

  return Response.json({ plan: mapPlanRow(row) }, { status: 201 });
}
