"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type CheckoutFormProps = {
  planId: string;
  priceLabel: string;
  email?: string;
};

export function CheckoutForm({ planId, priceLabel, email }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email: email?.trim() || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Ошибка создания платежа");
      }

      const { confirmationUrl } = await res.json();
      window.location.href = confirmationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handlePay}
        disabled={loading || (!email?.trim())}
      >
        {loading && <Spinner />}
        {loading ? "Создаём платёж…" : `Оплатить ${priceLabel}`}
      </Button>
    </div>
  );
}
