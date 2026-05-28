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
  customerEmail: string;
}

function receiptVatCode(): number {
  const raw = process.env.YOOKASSA_RECEIPT_VAT_CODE?.trim() ?? "1";
  const code = Number.parseInt(raw, 10);
  if (!Number.isFinite(code)) {
    throw new Error("YOOKASSA_RECEIPT_VAT_CODE must be a number");
  }
  return code;
}

function receiptPaymentSubject(): string {
  return process.env.YOOKASSA_RECEIPT_PAYMENT_SUBJECT?.trim() || "service";
}

function buildReceipt(params: CreatePaymentParams) {
  return {
    customer: {
      email: params.customerEmail,
    },
    items: [
      {
        description: params.description.slice(0, 128),
        quantity: 1,
        amount: {
          value: params.amount,
          currency: params.currency,
        },
        vat_code: receiptVatCode(),
        payment_mode: "full_payment",
        payment_subject: receiptPaymentSubject(),
      },
    ],
  };
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
      receipt: buildReceipt(params),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`YooKassa: ${res.status} — ${JSON.stringify(err)}`);
  }

  return res.json() as Promise<YookassaPayment>;
}
