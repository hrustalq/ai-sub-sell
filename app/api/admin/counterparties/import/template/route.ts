import { format } from "date-fns";
import { requireAdminApi } from "@/lib/admin";
import { buildCounterpartiesImportTemplate } from "@/lib/admin/counterparties-import";
import { excelResponse } from "@/lib/admin/excel";

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const buffer = buildCounterpartiesImportTemplate();
  const filename = `counterparties-import-template-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

  return excelResponse(buffer, filename);
}
