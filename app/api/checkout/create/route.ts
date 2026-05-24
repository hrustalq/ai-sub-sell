import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createCheckoutOrder } from "@/lib/checkout/create-order";

export async function POST(req: Request) {
  let planId: string;
  let email: string | undefined;

  try {
    ({ planId, email } = await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const buyerEmail = (session?.user?.email ?? email ?? "").trim().toLowerCase();

  const result = await createCheckoutOrder({
    planId,
    buyerEmail,
    sessionUserId: session?.user?.id,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    confirmationUrl: result.confirmationUrl,
    orderUrl: result.orderUrl,
  });
}
