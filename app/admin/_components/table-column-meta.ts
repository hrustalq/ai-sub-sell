import type { ColumnMeta } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export type AdminTableColumnMeta = {
  align?: "left" | "center" | "right";
  width?: string;
  numeric?: boolean;
};

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> extends AdminTableColumnMeta {}
}

export function getColumnWidth(
  meta: ColumnMeta<unknown, unknown> | undefined,
  fallback: string,
) {
  return meta?.width ?? fallback;
}

export function headerCellClass(meta: ColumnMeta<unknown, unknown> | undefined) {
  return cn(
    "h-10 bg-muted/40 px-3 align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
    meta?.align === "right" && "text-right",
    meta?.align === "center" && "text-center",
    (!meta?.align || meta.align === "left") && "text-left",
  );
}

export function bodyCellClass(meta: ColumnMeta<unknown, unknown> | undefined) {
  return cn(
    "px-3 py-2 align-middle",
    meta?.align === "right" && "text-right",
    meta?.align === "center" && "text-center",
    (!meta?.align || meta.align === "left") && "text-left",
    meta?.numeric && "tabular-nums",
  );
}
