"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { AdminUserRecord } from "@/lib/admin/types";
import { routes } from "@/lib/routes";
import { formatPrice } from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
            <Link
              href={routes.admin.user(row.original.id)}
              className="font-medium leading-tight hover:text-primary"
            >
              {row.original.name}
            </Link>
            <span className="text-xs text-muted-foreground sm:hidden">{row.original.email}</span>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {!row.original.emailVerified && (
                <Badge variant="outline" className="text-[10px]">
                  Email не подтверждён
                </Badge>
              )}
              {row.original.rbacAdmin && (
                <Badge variant="secondary" className="text-[10px]">
                  Админ
                </Badge>
              )}
              {row.original.rbacSupport && (
                <Badge variant="secondary" className="text-[10px]">
                  Поддержка
                </Badge>
              )}
              {row.original.telegramUserId && (
                <Badge variant="outline" className="text-[10px]">
                  Telegram
                </Badge>
              )}
            </div>
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
      {
        id: "actions",
        header: "",
        meta: { width: "10%", align: "right" },
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.admin.user(row.original.id)}>Настройки</Link>
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
        emptyMessage="Пользователей пока нет."
      />
    </div>
  );
}
