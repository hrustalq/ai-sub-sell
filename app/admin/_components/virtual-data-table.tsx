"use client";

import { useEffect, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TablePagination } from "@/app/admin/_components/table-pagination";
import {
  bodyCellClass,
  getColumnWidth,
  headerCellClass,
} from "@/app/admin/_components/table-column-meta";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 52;
const DEFAULT_BODY_MIN_HEIGHT = 280;

type VirtualDataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  emptyMessage?: string;
  initialPageSize?: number;
  className?: string;
  /** Fixed body height in px — use inside collapsible sections. */
  bodyHeight?: number;
};

export function VirtualDataTable<T>({
  data,
  columns,
  emptyMessage = "Нет данных",
  initialPageSize = 25,
  className,
  bodyHeight,
}: VirtualDataTableProps<T>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable refs by design
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: initialPageSize, pageIndex: 0 },
    },
  });

  const { rows } = table.getRowModel();
  const leafColumns = table.getVisibleLeafColumns();
  const defaultColWidth = `${100 / Math.max(leafColumns.length, 1)}%`;

  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollReady, setScrollReady] = useState(false);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when page data changes
  }, [rows.length, bodyHeight]);

  const virtualRows = virtualizer.getVirtualItems();
  const useVirtual = scrollReady && rows.length > 0;
  const paddingTop = useVirtual && virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    useVirtual && virtualRows.length > 0
      ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end
      : 0;

  const bodyStyle = bodyHeight
    ? { height: bodyHeight, minHeight: bodyHeight }
    : { minHeight: DEFAULT_BODY_MIN_HEIGHT };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        !bodyHeight && "min-h-[360px] flex-1",
        className,
      )}
    >
      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-auto"
        style={bodyStyle}
      >
        {rows.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center p-8 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <table className="w-full min-w-[640px] table-fixed caption-bottom text-sm">
            <colgroup>
              {leafColumns.map((column) => (
                <col
                  key={column.id}
                  style={{
                    width: getColumnWidth(column.columnDef.meta, defaultColWidth),
                  }}
                />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/40 [&_tr]:border-b [&_tr]:border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={headerCellClass(header.column.columnDef.meta)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {useVirtual ? (
                <>
                  {paddingTop > 0 && (
                    <tr aria-hidden>
                      <td style={{ height: paddingTop }} colSpan={leafColumns.length} />
                    </tr>
                  )}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index]!;
                    return (
                      <tr
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className="border-b border-border/60 hover:bg-muted/30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={bodyCellClass(cell.column.columnDef.meta)}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {paddingBottom > 0 && (
                    <tr aria-hidden>
                      <td
                        style={{ height: paddingBottom }}
                        colSpan={leafColumns.length}
                      />
                    </tr>
                  )}
                </>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={bodyCellClass(cell.column.columnDef.meta)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <TablePagination table={table} />
    </div>
  );
}
