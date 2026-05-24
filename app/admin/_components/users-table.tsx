"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { AdminUserRecord } from "@/lib/admin/types";
import { formatPrice } from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";

export function UsersTable({ data }: { data: AdminUserRecord[] }) {
  const columns = useMemo<ColumnDef<AdminUserRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Пользователь",
        meta: { width: "32%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-medium leading-tight">{row.original.name}</span>
            <span className="text-xs text-muted-foreground sm:hidden">{row.original.email}</span>
            {!row.original.emailVerified && (
              <Badge variant="outline" className="mt-0.5 w-fit text-[10px]">
                Email не подтверждён
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        meta: { width: "28%", align: "left" },
        cell: ({ row }) => (
          <span className="hidden text-muted-foreground md:inline">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "ordersCount",
        header: "Заказы",
        meta: { width: "12%", align: "right", numeric: true },
        cell: ({ row }) => row.original.ordersCount,
      },
      {
        accessorKey: "paidTotal",
        header: "Оплачено",
        meta: { width: "14%", align: "right", numeric: true },
        cell: ({ row }) =>
          row.original.paidTotal > 0 ? formatPrice(row.original.paidTotal, "RUB") : "—",
      },
      {
        accessorKey: "createdAt",
        header: "Регистрация",
        meta: { width: "14%", align: "right" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: ru })}
          </span>
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
        emptyMessage="Пользователей пока нет."
      />
    </div>
  );
}
