import { requireAdminApi } from "@/lib/admin";
import { executePlansImport } from "@/lib/admin/plans-import";
import { parsePlanInput, type PlanInput } from "@/lib/plans";

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

  if (!body || typeof body !== "object" || !Array.isArray((body as { rows?: unknown }).rows)) {
    return Response.json({ error: "Передайте массив rows" }, { status: 400 });
  }

  const rawRows = (body as { rows: unknown[] }).rows;
  const inputs: PlanInput[] = [];

  for (const raw of rawRows) {
    const parsed = parsePlanInput(raw);
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    if (!parsed.id) {
      return Response.json({ error: "У каждой строки должен быть ID тарифа" }, { status: 400 });
    }
    inputs.push(parsed);
  }

  if (inputs.length === 0) {
    return Response.json({ error: "Нет строк для импорта" }, { status: 400 });
  }

  const result = await executePlansImport(inputs);
  return Response.json(result);
}
