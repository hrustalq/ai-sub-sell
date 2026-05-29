"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ExternalLinkIcon, PackageIcon } from "lucide-react";
import type { SupportOrderDetailRecord } from "@/lib/support/types";
import { routes } from "@/lib/routes";
import type { OrderMessageRecord } from "@/lib/orders/types";
import { orderApiUrl } from "@/lib/orders/api-url";
import { useOrder } from "@/lib/orders/hooks";
import { formatPrice } from "@/lib/plans/client";
import { OrderChat } from "@/components/orders/order-chat";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type SupportOrderViewProps = {
  order: SupportOrderDetailRecord;
  initialMessages: OrderMessageRecord[];
  initialUnreadCount: number;
};

export function SupportOrderView({
  order: initialOrder,
  initialMessages,
  initialUnreadCount,
}: SupportOrderViewProps) {
  const { order, mutate } = useOrder(initialOrder.id, null, {
    fallback: {
      order: {
        id: initialOrder.id,
        orderNumber: initialOrder.orderNumber,
        planId: initialOrder.planId,
        planName: initialOrder.planName,
        amount: initialOrder.amount,
        currency: initialOrder.currency,
        status: initialOrder.status,
        buyerEmail: initialOrder.buyerEmail,
        productContent: initialOrder.productContent,
        confirmationUrl: initialOrder.confirmationUrl,
        createdAt: initialOrder.createdAt,
        updatedAt: initialOrder.updatedAt,
      },
      access: { canManageFulfillment: true, authorRole: "seller" },
    },
  });

  const [fulfillmentInput, setFulfillmentInput] = useState(
    initialOrder.productContent ?? "",
  );
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = order?.id ?? initialOrder.id;

  async function handleSaveFulfillment() {
    setSavingFulfillment(true);
    setError(null);
    try {
      const res = await fetch(orderApiUrl(orderId, "/fulfillment", null), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productContent: fulfillmentInput }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось сохранить данные");
      }
      const data = await res.json();
      await mutate(
        (current) =>
          current
            ? {
                ...current,
                order: { ...current.order, productContent: data.order.productContent },
              }
            : current,
        { revalidate: false },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSavingFulfillment(false);
    }
  }

  const customerName = initialOrder.user?.name ?? "Гость";
  const customerEmail = initialOrder.user?.email ?? initialOrder.buyerEmail;

  if (!order) return null;

  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2 lg:items-stretch">
      <Card className="flex min-h-0 flex-col overflow-visible lg:max-h-full">
        <CardHeader className="shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <PackageIcon className="size-5" />
                {order.planName}
                <OrderStatusBadge status={order.status} />
              </CardTitle>
              <CardDescription>
                № {order.id} · {customerName} · {customerEmail}
              </CardDescription>
              <CardDescription>
                {formatPrice(order.amount, order.currency)} ·{" "}
                {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={routes.order(order.id)} target="_blank">
                Страница покупателя
                <ExternalLinkIcon className="size-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {order.status === "PAID" && order.productContent ? (
            <pre className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
              {order.productContent}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              {order.status === "PAID"
                ? "Данные товара ещё не выданы покупателю."
                : "Данные товара доступны после оплаты."}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t pt-4">
            <Label htmlFor="fulfillment">Данные для покупателя</Label>
            <Textarea
              id="fulfillment"
              rows={6}
              value={fulfillmentInput}
              onChange={(e) => setFulfillmentInput(e.target.value)}
              placeholder="Логин, пароль, инструкция…"
            />
            <Button
              size="sm"
              onClick={handleSaveFulfillment}
              disabled={savingFulfillment || !fulfillmentInput.trim()}
            >
              {savingFulfillment && <Spinner />}
              Сохранить данные товара
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <OrderChat
        orderId={order.id}
        accessToken={null}
        authorRole="seller"
        initialMessages={initialMessages}
        initialUnreadCount={initialUnreadCount}
        orderLabel={order.planName}
        className="min-h-0 lg:h-full lg:max-h-full"
      />
    </div>
  );
}
