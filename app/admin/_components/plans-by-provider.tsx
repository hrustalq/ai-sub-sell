"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { AdminPlansProviderGroup } from "@/lib/admin/types";
import { usePlanTableColumns } from "@/app/admin/_components/plan-table-columns";
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
};

export function PlansByProvider({ groups }: PlansByProviderProps) {
  const columns = usePlanTableColumns();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

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
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-sm text-muted-foreground">
        Тарифов пока нет.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      {groups.map((group) => {
        const isOpen = openIds.has(group.id);
        const activeCount = group.plans.filter((p) => p.active).length;

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
  );
}
