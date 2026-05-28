"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import type { AdminPlansProviderGroup } from "@/lib/admin/types";
import type { ProviderMeta } from "@/lib/plans/client";
import { AdminPageShell } from "@/app/admin/_components/admin-page-shell";
import { AddProviderButton } from "@/app/admin/_components/manage-providers-button";
import { ExportPlansExcelButton } from "@/app/admin/_components/export-plans-excel-button";
import { ImportPlansExcelButton } from "@/app/admin/_components/import-plans-excel-button";
import { PlansByProvider } from "@/app/admin/_components/plans-by-provider";
import { Button } from "@/components/ui/button";

type AdminPlansPageClientProps = {
  groups: AdminPlansProviderGroup[];
  providers: ProviderMeta[];
};

export function AdminPlansPageClient({ groups, providers }: AdminPlansPageClientProps) {
  const [createProviderOpen, setCreateProviderOpen] = useState(false);

  return (
    <AdminPageShell
      fill
      title="Тарифы"
      description="Тарифы сгруппированы по провайдеру — раскройте секцию для просмотра"
      actions={
        <div className="flex items-center gap-2">
          <ImportPlansExcelButton />
          <ExportPlansExcelButton providers={providers} />
          <AddProviderButton onClick={() => setCreateProviderOpen(true)} />
          <Button asChild size="sm">
            <Link href="/admin/plans/new" className="gap-2">
              <PlusIcon className="size-4" />
              Новый тариф
            </Link>
          </Button>
        </div>
      }
    >
      <PlansByProvider
        groups={groups}
        providers={providers}
        createProviderOpen={createProviderOpen}
        onCreateProviderOpenChange={setCreateProviderOpen}
      />
    </AdminPageShell>
  );
}
