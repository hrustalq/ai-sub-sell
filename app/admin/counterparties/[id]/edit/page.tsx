import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getAdminCounterpartyById } from "@/lib/admin/counterparties";
import { routes } from "@/lib/routes";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { CounterpartyForm } from "@/app/admin/_components/counterparty-form";

export default async function EditCounterpartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const counterparty = await getAdminCounterpartyById(id);
  if (!counterparty) notFound();

  return (
    <AdminPageShell
      fill
      backHref={routes.admin.counterparties}
      backLabel="← К контрагентам"
    >
      <CounterpartyForm mode="edit" counterparty={counterparty} />
    </AdminPageShell>
  );
}
