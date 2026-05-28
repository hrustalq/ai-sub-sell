import { requireAdminApi } from "@/lib/admin";
import { executeCounterpartiesImport } from "@/lib/admin/counterparties-import";
import { parseCounterpartyInput, type CounterpartyInput } from "@/lib/counterparties";

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
  const inputs: CounterpartyInput[] = [];

  for (const raw of rawRows) {
    const parsed = parseCounterpartyInput(raw);
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    inputs.push(parsed);
  }

  if (inputs.length === 0) {
    return Response.json({ error: "Нет строк для импорта" }, { status: 400 });
  }

  const result = await executeCounterpartiesImport(inputs);
  return Response.json(result);
}
