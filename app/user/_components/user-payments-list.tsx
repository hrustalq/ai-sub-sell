"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ExternalLinkIcon } from "lucide-react";
import type { UserOrderRecord } from "@/lib/user/types";
import { formatPrice } from "@/lib/plans/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UserPaymentsList({ orders }: { orders: UserOrderRecord[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex h-full min-h-48 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">У вас пока нет заказов.</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/#pricing">Выбрать тариф</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Card className="py-0">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{order.planName}</p>
                  <OrderStatusBadge status={order.status} />
                  {order.unreadCount > 0 && (
                    <Badge variant="destructive">
                      {order.unreadCount} новых
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{order.id}</p>
                <time
                  dateTime={order.createdAt}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
                    locale: ru,
                  })}
                </time>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <p className="text-h4 font-bold tabular-nums text-foreground">
                  {formatPrice(order.amount, order.currency)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/orders/${order.id}`}>Открыть заказ</Link>
                  </Button>
                  {order.status === "PENDING" && order.confirmationUrl && (
                    <Button asChild size="sm">
                      <a
                        href={order.confirmationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Оплатить
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
