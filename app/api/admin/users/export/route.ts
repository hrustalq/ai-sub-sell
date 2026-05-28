import { format } from "date-fns";
import { requireAdminApi } from "@/lib/admin";
import { buildUsersWorkbook, excelResponse } from "@/lib/admin/excel";
import { parseExportDateRange } from "@/lib/admin/export-range";
import { getAdminUsers } from "@/lib/admin/queries";

export async function GET(req: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const rangeResult = parseExportDateRange(new URL(req.url).searchParams);
  if (rangeResult === "invalid") {
    return Response.json({ error: "Укажите корректный период" }, { status: 400 });
  }

  const range = rangeResult === "all" ? undefined : rangeResult;
  const users = await getAdminUsers(range);

  const buffer = buildUsersWorkbook(users);
  const filename =
    rangeResult === "all"
      ? `users-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      : `users-${format(rangeResult.from, "yyyy-MM-dd")}_${format(rangeResult.to, "yyyy-MM-dd")}.xlsx`;

  return excelResponse(buffer, filename);
}
