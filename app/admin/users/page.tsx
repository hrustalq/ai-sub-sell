import { getAdminUsers } from "@/lib/admin/queries";
import type { AdminUserRecord } from "@/lib/admin/types";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { UsersTable } from "@/app/admin/_components/users-table";

export default async function AdminUsersPage() {
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
    >
      <UsersTable data={data} />
    </AdminPageShell>
  );
}
