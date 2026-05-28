import "server-only";

import db from "@/lib/db";
import { DEFAULT_PROVIDERS } from "@/lib/plans/catalog";
import type { ProviderMeta } from "@/lib/plans/types";

type ProviderRow = {
  id: string;
  label: string;
  description: string;
  sortOrder: number;
  active: boolean;
};

export function mapProviderRow(row: ProviderRow): ProviderMeta {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export async function getActiveProviders(): Promise<ProviderMeta[]> {
  const rows = await db.planProvider.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  return rows.map(mapProviderRow);
}

export async function getAllProviders(): Promise<ProviderMeta[]> {
  const rows = await db.planProvider.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  return rows.map(mapProviderRow);
}

export async function getProviderById(id: string): Promise<ProviderMeta | null> {
  const row = await db.planProvider.findUnique({ where: { id } });
  return row ? mapProviderRow(row) : null;
}

export async function seedProvidersCatalog(): Promise<void> {
  for (const provider of DEFAULT_PROVIDERS) {
    await db.planProvider.upsert({
      where: { id: provider.id },
      create: {
        id: provider.id,
        label: provider.label,
        description: provider.description,
        sortOrder: provider.sortOrder,
        active: true,
      },
      update: {
        label: provider.label,
        description: provider.description,
        sortOrder: provider.sortOrder,
      },
    });
  }
}

export async function seedProvidersIfEmpty(): Promise<void> {
  const count = await db.planProvider.count();
  if (count === 0) {
    await seedProvidersCatalog();
  }
}
