import { requireSupportApi } from "@/lib/admin/api";
import { closeSupportConversation } from "@/lib/support/conversations/queries";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const context = await requireSupportApi();
  if (!context) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { conversationId } = await params;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.status !== "CLOSED") {
    return Response.json({ error: "Поддерживается только status=CLOSED" }, { status: 400 });
  }

  await closeSupportConversation(conversationId);
  return Response.json({ ok: true });
}
