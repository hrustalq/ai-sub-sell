import db from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import {
  deleteCounterparty,
  getCounterpartyById,
  parseCounterpartyInput,
  updateCounterparty,
} from "@/lib/counterparties";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const counterparty = await getCounterpartyById(id);
  if (!counterparty) {
    return Response.json({ error: "Контрагент не найден" }, { status: 404 });
  }

  return Response.json({ counterparty });
}

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

  const parsed = parseCounterpartyInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await db.counterparty.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Контрагент не найден" }, { status: 404 });
  }

  const counterparty = await updateCounterparty(id, parsed);
  return Response.json({ counterparty });
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await db.counterparty.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Контрагент не найден" }, { status: 404 });
  }

  await deleteCounterparty(id);
  return Response.json({ ok: true });
}
