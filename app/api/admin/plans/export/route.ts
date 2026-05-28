import { format } from "date-fns";
import { requireAdminApi } from "@/lib/admin";
import { buildPlansWorkbook, excelResponse } from "@/lib/admin/excel";
import { parsePlansExportParams } from "@/lib/admin/export-plans-params";
import { getAdminPlansForExport, getAdminProviders } from "@/lib/admin/plans";

export async function GET(req: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const params = parsePlansExportParams(new URL(req.url).searchParams);
  if (params === "invalid") {
    return Response.json({ error: "Некорректные параметры выгрузки" }, { status: 400 });
  }

  if (params.providerIds?.length) {
    const providers = await getAdminProviders();
    const knownIds = new Set(providers.map((provider) => provider.id));
    const hasUnknown = params.providerIds.some((id) => !knownIds.has(id));
    if (hasUnknown) {
      return Response.json({ error: "Провайдер не найден" }, { status: 400 });
    }
  }

  const plans = await getAdminPlansForExport({
    limit: params.limit,
    providerIds: params.providerIds,
  });

  const buffer = buildPlansWorkbook(plans);
  const date = format(new Date(), "yyyy-MM-dd");
  const providerPart = params.providerIds?.length
    ? params.providerIds.join("-")
    : "all";
  const limitPart = params.limit === "all" ? "all" : String(params.limit);
  const filename = `plans-${providerPart}-${limitPart}-${date}.xlsx`;

  return excelResponse(buffer, filename);
}
