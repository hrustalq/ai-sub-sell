import "server-only";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

function basicAuth(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) throw new Error("YooKassa credentials not configured");
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

export interface CreatePaymentParams {
  orderId: string;
  planId: string;
  userId: string;
  amount: string;
  currency: string;
  description: string;
  returnUrl: string;
}

export interface YookassaPayment {
  id: string;
  status: string;
  confirmation: {
    confirmation_url: string;
  };
  metadata: Record<string, string>;
}

export async function createPayment(params: CreatePaymentParams): Promise<YookassaPayment> {
  const res = await fetch(`${YOOKASSA_API}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(),
      "Idempotence-Key": params.orderId,
    },
    body: JSON.stringify({
      amount: { value: params.amount, currency: params.currency },
      confirmation: { type: "redirect", return_url: params.returnUrl },
      capture: true,
      description: params.description,
      metadata: {
        orderId: params.orderId,
        planId: params.planId,
        userId: params.userId,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`YooKassa: ${res.status} — ${JSON.stringify(err)}`);
  }

  return res.json() as Promise<YookassaPayment>;
}
