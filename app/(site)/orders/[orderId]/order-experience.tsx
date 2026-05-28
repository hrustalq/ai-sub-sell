"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertTriangleIcon,
  CopyIcon,
  ExternalLinkIcon,
  PackageIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/plans/client";
import { orderApiUrl } from "@/lib/orders/api-url";
import { useOrder } from "@/lib/orders/hooks";
import type { OrderMessageRecord, OrderRecord } from "@/lib/orders/types";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderChat } from "@/components/orders/order-chat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OrderExperienceProps = {
  initialOrder: OrderRecord;
  initialMessages: OrderMessageRecord[];
  initialUnreadCount?: number;
  accessToken: string | null;
  canManageFulfillment: boolean;
  authorRole: "buyer" | "seller";
};

export function OrderExperience({
  initialOrder,
  initialMessages,
  initialUnreadCount = 0,
  accessToken,
  canManageFulfillment,
  authorRole,
}: OrderExperienceProps) {
  const { order, mutate } = useOrder(initialOrder.id, accessToken, {
    fallback: {
      order: initialOrder,
      access: { canManageFulfillment, authorRole },
    },
  });

  const [fulfillmentInput, setFulfillmentInput] = useState(
    initialOrder.productContent ?? "",
  );
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  async function handleSaveFulfillment() {
    setSavingFulfillment(true);
    setError(null);
    try {
      const res = await fetch(
        orderApiUrl(order!.id, "/fulfillment", accessToken),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productContent: fulfillmentInput }),
        },
      );
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
                order: {
                  ...current.order,
                  productContent: data.order.productContent,
                },
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

  async function copyOrderLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Не удалось скопировать ссылку");
    }
  }

  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5",
        "min-h-0 max-lg:overflow-y-auto lg:overflow-hidden",
      )}
    >
      <div className="shrink-0 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Заказ</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1">
            {order.planName}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          № {order.id} ·{" "}
          {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
            locale: ru,
          })}
        </p>
      </div>

      {accessToken && (
        <Alert className="shrink-0">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Сохраните ссылку на заказ</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Это ваш личный доступ к покупке и чату с продавцом. Без ссылки
              войти в заказ будет нельзя.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyOrderLink}
            >
              <CopyIcon className="size-4" />
              {copied ? "Скопировано" : "Копировать ссылку"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid min-h-0 flex-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-0 flex-col overflow-visible lg:max-h-full">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="size-5" />
              Купленный товар
            </CardTitle>
            <CardDescription>
              {order.buyerEmail} · {formatPrice(order.amount, order.currency)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {order.status === "PENDING" && (
              <div className="rounded-lg border border-ring/30 bg-secondary px-4 py-3 text-sm">
                <p className="font-medium text-secondary-foreground">
                  Ожидаем подтверждение оплаты
                </p>
                <p className="mt-1 text-muted-foreground">
                  Если вы ещё не оплатили, перейдите по кнопке ниже. Данные
                  товара появятся после успешной оплаты.
                </p>
                {order.confirmationUrl && (
                  <Button asChild className="mt-3" size="sm">
                    <a
                      href={order.confirmationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Перейти к оплате
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {order.status === "PAID" && order.productContent ? (
              <pre className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
                {order.productContent}
              </pre>
            ) : order.status === "PAID" ? (
              <p className="text-sm text-muted-foreground">
                Продавец готовит данные доступа. Вы получите их здесь или в чате
                — можете задать вопрос справа.
              </p>
            ) : order.status === "CANCELED" ? (
              <p className="text-sm text-muted-foreground">
                Заказ отменён. Создайте новый заказ на главной, если хотите
                купить снова.
              </p>
            ) : null}

            {canManageFulfillment && (
              <div className="flex flex-col gap-2 border-t pt-4">
                <Label htmlFor="fulfillment">
                  Данные для покупателя (админ)
                </Label>
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
            )}

            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>

        <OrderChat
          orderId={order.id}
          accessToken={accessToken}
          authorRole={authorRole}
          initialMessages={initialMessages}
          initialUnreadCount={initialUnreadCount}
          orderLabel={order.planName}
          className="min-h-0 lg:h-full lg:max-h-full"
        />
      </div>

      {error && (
        <p className="shrink-0 text-sm text-destructive">{error}</p>
      )}
    </main>
  );
}
