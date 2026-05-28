import { format } from "date-fns";
import { requireAdminApi } from "@/lib/admin";
import { excelResponse } from "@/lib/admin/excel";
import { buildPlansImportTemplate } from "@/lib/admin/plans-import";
import { getAdminProviders } from "@/lib/admin/plans";

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const providers = await getAdminProviders();
  const buffer = buildPlansImportTemplate(providers.map((provider) => provider.id));
  const filename = `plans-import-template-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

  return excelResponse(buffer, filename);
}
