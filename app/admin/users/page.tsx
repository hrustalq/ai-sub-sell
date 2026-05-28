import { getAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin";
import type { AdminUserRecord } from "@/lib/admin/types";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { ExportExcelButton } from "@/app/admin/_components/export-excel-button";
import { UsersTable } from "@/app/admin/_components/users-table";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getAdminUsers();

  const data: AdminUserRecord[] = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <AdminPageShell
      fill
      title="Пользователи"
      description="Все зарегистрированные аккаунты и их активность"
      actions={
        <ExportExcelButton
          href="/api/admin/users/export"
          title="Экспорт пользователей"
          description="Выберите период регистрации или быстрый пресет, затем скачайте Excel-файл."
          label="Экспорт в Excel"
        />
      }
    >
      <UsersTable data={data} />
    </AdminPageShell>
  );
}
