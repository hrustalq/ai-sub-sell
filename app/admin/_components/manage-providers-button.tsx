"use client";

import { PlusIcon, PencilIcon } from "lucide-react";
import type { ProviderMeta } from "@/lib/plans/client";
import { ProviderFormDialog } from "@/app/admin/_components/provider-form-dialog";
import { Button } from "@/components/ui/button";

export function AddProviderButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <PlusIcon className="size-4" />
      Провайдер
    </Button>
  );
}

export function EditProviderButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Редактировать ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <PencilIcon className="size-4" />
    </Button>
  );
}

export function ProviderDialogs({
  createOpen,
  onCreateOpenChange,
  editProvider,
  onEditProviderChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  editProvider: ProviderMeta | null;
  onEditProviderChange: (provider: ProviderMeta | null) => void;
}) {
  return (
    <>
      <ProviderFormDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        mode="create"
      />
      {editProvider && (
        <ProviderFormDialog
          open={editProvider != null}
          onOpenChange={(open) => {
            if (!open) onEditProviderChange(null);
          }}
          mode="edit"
          provider={editProvider}
        />
      )}
    </>
  );
}
