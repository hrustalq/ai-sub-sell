import { format } from "date-fns";
import { requireAdminApi } from "@/lib/admin";
import { getAdminCounterpartiesForExport } from "@/lib/admin/counterparties";
import { buildCounterpartiesWorkbook, excelResponse } from "@/lib/admin/excel";
import { parseExportDateRange } from "@/lib/admin/export-range";

export async function GET(req: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const rangeResult = parseExportDateRange(new URL(req.url).searchParams);
  if (rangeResult === "invalid") {
    return Response.json({ error: "Укажите корректный период" }, { status: 400 });
  }

  const range = rangeResult === "all" ? undefined : rangeResult;
  const rows = await getAdminCounterpartiesForExport(range);
  const buffer = buildCounterpartiesWorkbook(rows);
  const filename =
    rangeResult === "all"
      ? `counterparties-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      : `counterparties-${format(rangeResult.from, "yyyy-MM-dd")}_${format(rangeResult.to, "yyyy-MM-dd")}.xlsx`;

  return excelResponse(buffer, filename);
}
