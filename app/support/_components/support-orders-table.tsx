"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { SupportOrderRecord } from "@/lib/support/types";
import { formatPrice } from "@/lib/plans/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function SupportOrdersTable({ data }: { data: SupportOrderRecord[] }) {
  const columns = useMemo<ColumnDef<SupportOrderRecord, unknown>[]>(
    () => [
      {
        accessorKey: "planName",
        header: "Заказ",
        meta: { width: "22%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-medium leading-tight">{row.original.planName}</span>
            <span className="text-xs text-muted-foreground">{row.original.id}</span>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Клиент",
        meta: { width: "22%", align: "left" },
        cell: ({ row }) => (
          <div className="hidden flex-col gap-0.5 text-sm sm:flex">
            <span>{row.original.user?.name ?? "Гость"}</span>
            <span className="text-muted-foreground">
              {row.original.user?.email ?? row.original.buyerEmail}
            </span>
          </div>
        ),
      },
      {
        id: "lastMessage",
        header: "Последнее сообщение",
        meta: { width: "26%", align: "left" },
        cell: ({ row }) => {
          const message = row.original.lastMessage;
          if (!message) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {message.author === "buyer" ? "Покупатель" : "Поддержка"}:{" "}
              {truncate(message.body)}
            </p>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Статус",
        meta: { width: "12%", align: "left" },
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "amount",
        header: "Сумма",
        meta: { width: "10%", align: "right", numeric: true },
        cell: ({ row }) => (
          <span className="font-medium">
            {formatPrice(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        id: "messages",
        header: "Чат",
        meta: { width: "8%", align: "center" },
        cell: ({ row }) =>
          row.original.unreadCount > 0 ? (
            <Badge variant="destructive">{row.original.unreadCount}</Badge>
          ) : row.original.messageCount > 0 ? (
            <span className="text-xs text-muted-foreground">{row.original.messageCount}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "updatedAt",
        header: "Обновлён",
        meta: { width: "10%", align: "right" },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            <div>{format(new Date(row.original.updatedAt), "dd MMM yyyy", { locale: ru })}</div>
            <div className="text-xs">
              {format(new Date(row.original.updatedAt), "HH:mm", { locale: ru })}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { width: "10%", align: "right" },
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/support/${row.original.id}`}>Открыть</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-[360px] flex-1 flex-col">
      <VirtualDataTable
        data={data}
        columns={columns}
        emptyMessage="Заказов пока нет."
      />
    </div>
  );
}
