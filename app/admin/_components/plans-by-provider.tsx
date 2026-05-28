"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { AdminPlansProviderGroup } from "@/lib/admin/types";
import type { ProviderMeta } from "@/lib/plans/client";
import { usePlanTableColumns } from "@/app/admin/_components/plan-table-columns";
import {
  EditProviderButton,
  ProviderDialogs,
} from "@/app/admin/_components/manage-providers-button";
import { VirtualDataTable } from "@/app/admin/_components/virtual-data-table";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type PlansByProviderProps = {
  groups: AdminPlansProviderGroup[];
  providers: ProviderMeta[];
  createProviderOpen?: boolean;
  onCreateProviderOpenChange?: (open: boolean) => void;
};

export function PlansByProvider({
  groups,
  providers,
  createProviderOpen = false,
  onCreateProviderOpenChange,
}: PlansByProviderProps) {
  const columns = usePlanTableColumns();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [editProvider, setEditProvider] = useState<ProviderMeta | null>(null);

  function toggleProvider(id: string, open: boolean) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-sm text-muted-foreground">
          Провайдеров пока нет. Добавьте первого провайдера, затем создайте тарифы.
        </div>
        {onCreateProviderOpenChange && (
          <ProviderDialogs
            createOpen={createProviderOpen}
            onCreateOpenChange={onCreateProviderOpenChange}
            editProvider={editProvider}
            onEditProviderChange={setEditProvider}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {groups.map((group) => {
          const isOpen = openIds.has(group.id);
          const activeCount = group.plans.filter((plan) => plan.active).length;
          const providerMeta = providers.find((provider) => provider.id === group.id);

          return (
            <Collapsible
              key={group.id}
              open={isOpen}
              onOpenChange={(open) => toggleProvider(group.id, open)}
              className="shrink-0 overflow-hidden rounded-xl border border-border bg-card"
            >
              <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
                <ChevronDownIcon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{group.label}</span>
                    {!group.active && (
                      <Badge variant="outline" className="text-[10px]">
                        скрыт
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {group.plans.length} тариф(ов)
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {activeCount} активн.
                    </Badge>
                  </div>
                  {group.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>
                {providerMeta && (
                  <EditProviderButton
                    label={group.label}
                    onClick={() => setEditProvider(providerMeta)}
                  />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-border">
                  {group.plans.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Нет тарифов для этого провайдера
                    </p>
                  ) : (
                    <VirtualDataTable
                      data={group.plans}
                      columns={columns}
                      emptyMessage="Нет тарифов"
                      initialPageSize={10}
                      bodyHeight={280}
                      className="rounded-none border-0 shadow-none"
                    />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {onCreateProviderOpenChange && (
        <ProviderDialogs
          createOpen={createProviderOpen}
          onCreateOpenChange={onCreateProviderOpenChange}
          editProvider={editProvider}
          onEditProviderChange={setEditProvider}
        />
      )}
    </>
  );
}
