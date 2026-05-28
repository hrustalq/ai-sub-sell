import "server-only";

import db from "@/lib/db";
import type { ExportDateRange } from "@/lib/admin/export-range";
import { createdAtRangeWhere } from "@/lib/admin/export-range";
import type {
  AdminCounterpartyDetailRecord,
  AdminCounterpartyExportRow,
  AdminCounterpartyRecord,
} from "@/lib/admin/types";
import type { Counterparty } from "@/lib/counterparties/types";

export function toAdminCounterpartyRecord(
  counterparty: Counterparty,
): AdminCounterpartyRecord {
  return {
    id: counterparty.id,
    name: counterparty.name,
    notes: counterparty.notes,
    contactName: counterparty.contactName,
    contactEmail: counterparty.contactEmail,
    contactPhone: counterparty.contactPhone,
    wechatId: counterparty.wechatId,
    shopUrl: counterparty.shopUrl,
    active: counterparty.active,
    sortOrder: counterparty.sortOrder,
    pricingOptionsCount: counterparty.pricingOptions.length,
  };
}

export function toAdminCounterpartyDetailRecord(
  counterparty: Counterparty,
): AdminCounterpartyDetailRecord {
  const { pricingOptionsCount: _count, ...base } = toAdminCounterpartyRecord(counterparty);
  return {
    ...base,
    pricingOptions: counterparty.pricingOptions.map((option) => ({
      id: option.id,
      label: option.label,
      price: option.price,
      currency: option.currency,
      notes: option.notes,
      sortOrder: option.sortOrder,
      active: option.active,
    })),
  };
}

export async function getAdminCounterparties(): Promise<AdminCounterpartyRecord[]> {
  const { getAllCounterparties } = await import("@/lib/counterparties/repository");
  const counterparties = await getAllCounterparties();
  return counterparties.map(toAdminCounterpartyRecord);
}

export async function getAdminCounterpartyById(
  id: string,
): Promise<AdminCounterpartyDetailRecord | null> {
  const { getCounterpartyById } = await import("@/lib/counterparties/repository");
  const counterparty = await getCounterpartyById(id);
  return counterparty ? toAdminCounterpartyDetailRecord(counterparty) : null;
}

function toExportRows(counterparty: Counterparty & { createdAt: Date }): AdminCounterpartyExportRow[] {
  const base = {
    counterpartyId: counterparty.id,
    name: counterparty.name,
    notes: counterparty.notes,
    contactName: counterparty.contactName,
    contactEmail: counterparty.contactEmail,
    contactPhone: counterparty.contactPhone,
    wechatId: counterparty.wechatId,
    shopUrl: counterparty.shopUrl,
    counterpartyActive: counterparty.active,
    counterpartySortOrder: counterparty.sortOrder,
    createdAt: counterparty.createdAt,
  };

  if (counterparty.pricingOptions.length === 0) {
    return [
      {
        ...base,
        optionId: null,
        optionLabel: null,
        optionPrice: null,
        optionCurrency: null,
        optionNotes: null,
        optionActive: null,
        optionSortOrder: null,
      },
    ];
  }

  return counterparty.pricingOptions.map((option) => ({
    ...base,
    optionId: option.id,
    optionLabel: option.label,
    optionPrice: option.price,
    optionCurrency: option.currency,
    optionNotes: option.notes,
    optionActive: option.active,
    optionSortOrder: option.sortOrder,
  }));
}

export async function getAdminCounterpartiesForExport(
  range?: ExportDateRange,
): Promise<AdminCounterpartyExportRow[]> {
  const rows = await db.counterparty.findMany({
    where: range ? createdAtRangeWhere(range) : undefined,
    include: {
      pricingOptions: {
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.flatMap((row) =>
    toExportRows({
      id: row.id,
      name: row.name,
      notes: row.notes,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      wechatId: row.wechatId,
      shopUrl: row.shopUrl,
      active: row.active,
      sortOrder: row.sortOrder,
      pricingOptions: row.pricingOptions.map((option) => ({
        id: option.id,
        counterpartyId: option.counterpartyId,
        label: option.label,
        price: option.price,
        currency: option.currency,
        notes: option.notes,
        sortOrder: option.sortOrder,
        active: option.active,
      })),
      createdAt: row.createdAt,
    }),
  );
}
