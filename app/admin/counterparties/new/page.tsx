import { requireAdmin } from "@/lib/admin";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { CounterpartyForm } from "@/app/admin/_components/counterparty-form";
import { routes } from "@/lib/routes";

export default async function NewCounterpartyPage() {
  await requireAdmin();

  return (
    <AdminPageShell
      fill
      backHref={routes.admin.counterparties}
      backLabel="← К контрагентам"
    >
      <CounterpartyForm mode="create" />
    </AdminPageShell>
  );
}
