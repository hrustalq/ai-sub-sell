import { requireAdminApi } from "@/lib/admin";
import {
  createCounterparty,
  getAllCounterparties,
  parseCounterpartyInput,
} from "@/lib/counterparties";

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const counterparties = await getAllCounterparties();
  return Response.json({ counterparties });
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

  const parsed = parseCounterpartyInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const counterparty = await createCounterparty(parsed);
  return Response.json({ counterparty }, { status: 201 });
}
