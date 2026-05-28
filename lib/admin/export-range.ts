import "server-only";

import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";

export type ExportDateRange = {
  from: Date;
  to: Date;
};

export function parseExportDateRange(
  searchParams: URLSearchParams,
): ExportDateRange | "all" | "invalid" {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  if (!fromRaw && !toRaw) {
    return "all";
  }

  if (!fromRaw || !toRaw) {
    return "invalid";
  }

  const from = startOfDay(parseISO(fromRaw));
  const to = endOfDay(parseISO(toRaw));

  if (!isValid(from) || !isValid(to) || from > to) {
    return "invalid";
  }

  return { from, to };
}

export function createdAtRangeWhere(range: ExportDateRange) {
  return {
    createdAt: {
      gte: range.from,
      lte: range.to,
    },
  };
}
