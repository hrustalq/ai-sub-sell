"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { AdminPaymentRecord } from "@/lib/admin/types";
import { formatPrice } from "@/lib/plans/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";

export function PaymentsTable({ data }: { data: AdminPaymentRecord[] }) {
  const columns = useMemo<ColumnDef<AdminPaymentRecord, unknown>[]>(
    () => [
      {
        accessorKey: "planName",
        header: "Заказ",
        meta: { width: "26%", align: "left" },
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
        meta: { width: "28%", align: "left" },
        cell: ({ row }) => (
          <div className="hidden flex-col gap-0.5 text-sm sm:flex">
            <span>{row.original.user.name}</span>
            <span className="text-muted-foreground">{row.original.user.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Сумма",
        meta: { width: "14%", align: "right", numeric: true },
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
        meta: { width: "16%", align: "right" },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            <div>{format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: ru })}</div>
            <div className="text-xs">
              {format(new Date(row.original.createdAt), "HH:mm", { locale: ru })}
            </div>
          </div>
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
        emptyMessage="Платежей пока нет."
      />
    </div>
  );
}
