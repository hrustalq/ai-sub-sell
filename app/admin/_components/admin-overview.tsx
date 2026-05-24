"use client";

import Link from "next/link";
import type { AdminLogEntry, AdminStatsSnapshot } from "@/lib/admin/types";
import { formatPrice } from "@/lib/plans/client";
import { ActivityLog } from "@/app/admin/_components/activity-log";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminOverviewProps = {
  stats: AdminStatsSnapshot;
  log: AdminLogEntry[];
};

export function AdminOverview({ stats, log }: AdminOverviewProps) {
  const cards = [
    {
      title: "Пользователи",
      value: stats.usersCount,
      hint: "зарегистрировано",
      href: "/admin/users",
    },
    {
      title: "Выручка",
      value: formatPrice(stats.revenueTotal, "RUB"),
      hint: `${stats.paidOrdersCount} оплачено`,
      href: "/admin/payments",
    },
    {
      title: "В ожидании",
      value: stats.pendingOrdersCount,
      hint: "неоплаченных заказов",
      href: "/admin/payments",
    },
    {
      title: "Активные тарифы",
      value: stats.activePlansCount,
      hint: `из ${stats.ordersCount} заказов всего`,
      href: "/admin/plans",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Обзор
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ключевые показатели и последние события
        </p>
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="py-0">
            <CardHeader className="px-4 py-3 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4 pb-3">
              <p className="text-xl font-bold tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
              <Button
                asChild
                variant="link"
                size="sm"
                className="h-auto w-fit px-0 text-xs"
              >
                <Link href={card.href}>Подробнее</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0">
        <CardHeader className="shrink-0 border-b border-border">
          <CardTitle className="text-sm font-semibold">
            Журнал событий
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 p-0">
          <ActivityLog entries={log} />
        </CardContent>
      </Card>
    </div>
  );
}
