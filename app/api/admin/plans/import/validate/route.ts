import { requireAdminApi } from "@/lib/admin";
import { validatePlansImport } from "@/lib/admin/plans-import";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Выберите файл Excel" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "Файл слишком большой (макс. 5 МБ)" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const result = await validatePlansImport(buffer);

  return Response.json(result);
}
