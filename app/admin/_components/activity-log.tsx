"use client";

import { useEffect, useRef, useState } from "react";
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

const LOG_ROW_ESTIMATE_HEIGHT = 68;

function LogIcon({ type }: { type: AdminLogEntry["type"] }) {
  const className = "mt-0.5 size-4 shrink-0";
  switch (type) {
    case "user_registered":
      return <UserPlusIcon className={cn(className, "text-primary")} />;
    case "order_paid":
      return <CheckCircle2Icon className={cn(className, "text-primary")} />;
    case "order_canceled":
      return <XCircleIcon className={cn(className, "text-muted-foreground")} />;
    default:
      return <CreditCardIcon className={cn(className, "text-muted-foreground")} />;
  }
}

function LogRow({
  entry,
  className,
  style,
  measureRef,
  index,
}: {
  entry: AdminLogEntry;
  className?: string;
  style?: React.CSSProperties;
  measureRef?: (node: Element | null) => void;
  index?: number;
}) {
  return (
    <li
      data-index={index}
      ref={measureRef}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border/50 px-4 py-3.5",
        className,
      )}
      style={style}
    >
      <LogIcon type={entry.type} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{entry.message}</p>
        {entry.detail && (
          <p className="truncate text-xs text-muted-foreground">{entry.detail}</p>
        )}
      </div>
      <time
        dateTime={entry.createdAt}
        className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground"
      >
        {format(new Date(entry.createdAt), "dd MMM, HH:mm", { locale: ru })}
      </time>
    </li>
  );
}

export function ActivityLog({ entries }: { entries: AdminLogEntry[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollReady, setScrollReady] = useState(false);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual returns unstable refs by design
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LOG_ROW_ESTIMATE_HEIGHT,
    overscan: 8,
    getItemKey: (index) => entries[index]!.id,
  });

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const update = () => {
      setScrollReady(el.clientHeight > 0);
      virtualizer.measure();
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when list size changes
  }, [entries.length]);

  const virtualRows = virtualizer.getVirtualItems();
  const useVirtual = scrollReady && entries.length > 0;
  const paddingTop = useVirtual && virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    useVirtual && virtualRows.length > 0
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
      {useVirtual ? (
        <ul>
          {paddingTop > 0 && <li aria-hidden style={{ height: paddingTop }} />}
          {virtualRows.map((virtualRow) => (
            <LogRow
              key={entries[virtualRow.index]!.id}
              entry={entries[virtualRow.index]!}
              index={virtualRow.index}
              measureRef={virtualizer.measureElement}
            />
          ))}
          {paddingBottom > 0 && <li aria-hidden style={{ height: paddingBottom }} />}
        </ul>
      ) : (
        <ul>
          {entries.map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
