"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { type ColumnDef } from "@tanstack/react-table";
import "@/app/admin/_components/table-column-meta";
import type { SupportConversationRecord } from "@/lib/support/types";
import { routes } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function SupportConversationsTable({ data }: { data: SupportConversationRecord[] }) {
  const columns = useMemo<ColumnDef<SupportConversationRecord, unknown>[]>(
    () => [
      {
        accessorKey: "buyerLabel",
        header: "Клиент",
        meta: { width: "24%", align: "left" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="font-medium leading-tight">{row.original.buyerLabel}</span>
            <span className="text-xs text-muted-foreground">{row.original.id}</span>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Контакт",
        meta: { width: "22%", align: "left" },
        cell: ({ row }) => (
          <div className="hidden flex-col gap-0.5 text-sm sm:flex">
            <span>{row.original.buyerEmail ?? "—"}</span>
            {row.original.buyerTelegramUserId && (
              <span className="text-muted-foreground">Telegram</span>
            )}
          </div>
        ),
      },
      {
        id: "lastMessage",
        header: "Последнее сообщение",
        meta: { width: "30%", align: "left" },
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
        meta: { width: "12%", align: "right" },
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
            <Link href={routes.admin.supportConversation(row.original.id)}>Открыть</Link>
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
        emptyMessage="Обращений пока нет."
      />
    </div>
  );
}
