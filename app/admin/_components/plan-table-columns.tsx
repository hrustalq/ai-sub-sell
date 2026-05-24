"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { AdminPlanRecord } from "@/lib/admin/types";
import { formatPrice } from "@/lib/plans/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeletePlanButton } from "@/app/admin/_components/delete-plan-button";

export function usePlanTableColumns() {
  return useMemo<ColumnDef<AdminPlanRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Тариф",
        meta: { width: "28%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-medium leading-tight">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.id}</span>
          </div>
        ),
      },
      {
        id: "option",
        header: "Опция",
        meta: { width: "22%", align: "left" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.tierLabel} · {row.original.period}
          </span>
        ),
      },
      {
        id: "price",
        header: "Цена",
        meta: { width: "14%", align: "right", numeric: true },
        cell: ({ row }) => (
          <div>
            {formatPrice(row.original.price, row.original.currency)}
            {row.original.compareAtPrice &&
              row.original.compareAtPrice > row.original.price && (
                <span className="ml-1 text-xs text-muted-foreground line-through">
                  {formatPrice(row.original.compareAtPrice, row.original.currency)}
                </span>
              )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Статус",
        meta: { width: "18%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.active ? (
              <Badge variant="secondary" className="text-[10px]">
                Активен
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Скрыт
              </Badge>
            )}
            {row.original.highlight && (
              <Badge className="text-[10px]">Популярный</Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Действия",
        meta: { width: "18%", align: "right" },
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link
                href={`/admin/plans/${row.original.id}/edit`}
                aria-label={`Редактировать ${row.original.name}`}
              >
                <PencilIcon className="size-4" />
              </Link>
            </Button>
            <DeletePlanButton planId={row.original.id} planName={row.original.name} />
          </div>
        ),
      },
    ],
    [],
  );
}
