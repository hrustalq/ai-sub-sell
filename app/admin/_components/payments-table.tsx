"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { AdminPaymentRecord } from "@/lib/admin/types";
import { routes } from "@/lib/routes";
import { formatPrice } from "@/lib/plans/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";

export function PaymentsTable({
  data,
  hideCustomer = false,
}: {
  data: AdminPaymentRecord[];
  hideCustomer?: boolean;
}) {
  const columns = useMemo<ColumnDef<AdminPaymentRecord, unknown>[]>(
    () => [
      {
        accessorKey: "planName",
        header: "Заказ",
        meta: { width: hideCustomer ? "34%" : "26%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-medium leading-tight">{row.original.planName}</span>
            <span className="text-xs text-muted-foreground">{row.original.id}</span>
          </div>
        ),
      },
      ...(hideCustomer
        ? []
        : [
            {
              id: "customer",
              header: "Клиент",
              meta: { width: "28%", align: "left" as const },
              cell: ({ row }: { row: { original: AdminPaymentRecord } }) => (
                <div className="hidden flex-col gap-0.5 text-sm sm:flex">
                  <span>{row.original.user?.name ?? "Гость"}</span>
                  <span className="text-muted-foreground">
                    {row.original.user?.email ?? row.original.buyerEmail}
                  </span>
                </div>
              ),
            },
          ]),
      {
        accessorKey: "amount",
        header: "Сумма",
        meta: { width: hideCustomer ? "18%" : "14%", align: "right", numeric: true },
        cell: ({ row }) => (
          <span className="font-medium">
            {formatPrice(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Статус",
        meta: { width: "16%", align: "left" },
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Дата",
        meta: { width: "12%", align: "right" },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            <div>{format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: ru })}</div>
            <div className="text-xs">
              {format(new Date(row.original.createdAt), "HH:mm", { locale: ru })}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { width: "12%", align: "right" },
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.admin.supportOrder(row.original.id)}>Открыть</Link>
          </Button>
        ),
      },
    ],
    [hideCustomer],
  );

  return (
    <div className="flex min-h-[360px] flex-1 flex-col">
      <VirtualDataTable
        data={data}
        columns={columns}
        emptyMessage="Платежей пока нет."
      />
    </div>
  );
}
