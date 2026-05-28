import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getAdminCounterparties } from "@/lib/admin/counterparties";
import { routes } from "@/lib/routes";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { CounterpartiesTable } from "@/app/admin/_components/counterparties-table";
import { ExportExcelButton } from "@/app/admin/_components/export-excel-button";
import { ImportCounterpartiesExcelButton } from "@/app/admin/_components/import-counterparties-excel-button";
import { Button } from "@/components/ui/button";

export default async function AdminCounterpartiesPage() {
  await requireAdmin();
  const counterparties = await getAdminCounterparties();

  return (
    <AdminPageShell
      fill
      title="Контрагенты"
      description="Поставщики аккаунтов для подписок: контакты, WeChat, магазины и закупочные цены"
      actions={
        <div className="flex items-center gap-2">
          <ImportCounterpartiesExcelButton />
          <ExportExcelButton
            href="/api/admin/counterparties/export"
            title="Экспорт контрагентов"
            description="Выберите период создания или быстрый пресет, затем скачайте Excel-файл с контрагентами и ценами."
            label="Экспорт в Excel"
          />
          <Button asChild size="sm">
            <Link href={routes.admin.counterpartyNew}>Добавить контрагента</Link>
          </Button>
        </div>
      }
    >
      <CounterpartiesTable data={counterparties} />
    </AdminPageShell>
  );
}
