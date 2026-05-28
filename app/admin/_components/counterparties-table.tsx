"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { AdminCounterpartyRecord } from "@/lib/admin/types";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";

export function CounterpartiesTable({ data }: { data: AdminCounterpartyRecord[] }) {
  const columns = useMemo<ColumnDef<AdminCounterpartyRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Контрагент",
        meta: { width: "28%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <Link
              href={routes.admin.counterpartyEdit(row.original.id)}
              className="font-medium leading-tight hover:text-primary"
            >
              {row.original.name}
            </Link>
            <span className="text-xs text-muted-foreground">{row.original.id}</span>
            {row.original.notes ? (
              <span className="line-clamp-2 text-xs text-muted-foreground">{row.original.notes}</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "wechatId",
        header: "WeChat",
        meta: { width: "16%", align: "left" },
        cell: ({ row }) =>
          row.original.wechatId ? (
            <span className="font-mono text-sm">{row.original.wechatId}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "shopUrl",
        header: "Магазин",
        meta: { width: "16%", align: "left" },
        cell: ({ row }) =>
          row.original.shopUrl ? (
            <a
              href={row.original.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Открыть
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "pricingOptionsCount",
        header: "Цены",
        meta: { width: "10%", align: "right", numeric: true },
        cell: ({ row }) => row.original.pricingOptionsCount,
      },
      {
        accessorKey: "active",
        header: "Статус",
        meta: { width: "12%", align: "left" },
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="secondary">Активен</Badge>
          ) : (
            <Badge variant="outline">Отключён</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        meta: { width: "12%", align: "right" },
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={routes.admin.counterpartyEdit(row.original.id)}>Открыть</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <VirtualDataTable
      data={data}
      columns={columns}
      emptyMessage="Контрагентов пока нет"
    />
  );
}
