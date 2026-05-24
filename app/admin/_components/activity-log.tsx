"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  UserPlusIcon,
  CreditCardIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import type { AdminLogEntry } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const LOG_ROW_HEIGHT = 56;

function LogIcon({ type }: { type: AdminLogEntry["type"] }) {
  const className = "size-4 shrink-0";
  switch (type) {
    case "user_registered":
      return <UserPlusIcon className={cn(className, "text-blue-500")} />;
    case "order_paid":
      return <CheckCircle2Icon className={cn(className, "text-primary")} />;
    case "order_canceled":
      return <XCircleIcon className={cn(className, "text-muted-foreground")} />;
    default:
      return <CreditCardIcon className={cn(className, "text-amber-600")} />;
  }
}

export function ActivityLog({ entries }: { entries: AdminLogEntry[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LOG_ROW_HEIGHT,
    overscan: 6,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
      : 0;

  if (entries.length === 0) {
    return (
      <p className="flex h-full min-h-32 items-center justify-center text-sm text-muted-foreground">
        Событий пока нет
      </p>
    );
  }

  return (
    <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
      <ul style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {paddingTop > 0 && <li style={{ height: paddingTop }} aria-hidden />}
        {virtualRows.map((virtualRow) => {
          const entry = entries[virtualRow.index]!;
          return (
            <li
              key={entry.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 flex w-full items-center gap-3 border-b border-border/60 px-4 py-3"
              style={{
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
                height: LOG_ROW_HEIGHT,
              }}
            >
              <LogIcon type={entry.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.message}
                </p>
                {entry.detail && (
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.detail}
                  </p>
                )}
              </div>
              <time
                dateTime={entry.createdAt}
                className="shrink-0 text-xs text-muted-foreground whitespace-nowrap"
              >
                {format(new Date(entry.createdAt), "dd MMM, HH:mm", {
                  locale: ru,
                })}
              </time>
            </li>
          );
        })}
        {paddingBottom > 0 && (
          <li style={{ height: paddingBottom }} aria-hidden />
        )}
      </ul>
    </div>
  );
}
