import db from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { getAllProviders, mapProviderRow } from "@/lib/plans/providers";
import { parseProviderInput } from "@/lib/plans";

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const providers = await getAllProviders();
  return Response.json({ providers });
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

  const parsed = parseProviderInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  if (!parsed.id) {
    return Response.json({ error: "Укажите ID провайдера" }, { status: 400 });
  }

  const existing = await db.planProvider.findUnique({ where: { id: parsed.id } });
  if (existing) {
    return Response.json({ error: "Провайдер с таким ID уже существует" }, { status: 409 });
  }

  const row = await db.planProvider.create({
    data: {
      id: parsed.id,
      label: parsed.label,
      description: parsed.description,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
    },
  });

  return Response.json({ provider: mapProviderRow(row) }, { status: 201 });
}
