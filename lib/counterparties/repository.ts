import "server-only";

import db from "@/lib/db";
import type { Counterparty, CounterpartyPricingOption } from "@/lib/counterparties/types";
import type { CounterpartyInput } from "@/lib/counterparties/validation";
import { sortPricingOptions } from "@/lib/counterparties/validation";

type CounterpartyRow = {
  id: string;
  name: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  wechatId: string;
  shopUrl: string;
  active: boolean;
  sortOrder: number;
};

type PricingOptionRow = {
  id: string;
  counterpartyId: string;
  label: string;
  price: number;
  currency: string;
  notes: string;
  sortOrder: number;
  active: boolean;
};

type CounterpartyWithOptionsRow = CounterpartyRow & {
  pricingOptions: PricingOptionRow[];
};

export function mapPricingOptionRow(row: PricingOptionRow): CounterpartyPricingOption {
  return {
    id: row.id,
    counterpartyId: row.counterpartyId,
    label: row.label,
    price: row.price,
    currency: row.currency,
    notes: row.notes,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export function mapCounterpartyRow(
  row: CounterpartyWithOptionsRow,
): Counterparty {
  return {
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
    pricingOptions: sortPricingOptions(row.pricingOptions.map(mapPricingOptionRow)),
  };
}

const counterpartyInclude = {
  pricingOptions: {
    orderBy: [{ sortOrder: "asc" as const }, { label: "asc" as const }],
  },
};

export async function getAllCounterparties(): Promise<Counterparty[]> {
  const rows = await db.counterparty.findMany({
    include: counterpartyInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapCounterpartyRow);
}

export async function getCounterpartyById(id: string): Promise<Counterparty | null> {
  const row = await db.counterparty.findUnique({
    where: { id },
    include: counterpartyInclude,
  });
  return row ? mapCounterpartyRow(row) : null;
}

async function syncPricingOptions(
  counterpartyId: string,
  options: CounterpartyInput["pricingOptions"],
): Promise<void> {
  const existing = await db.counterpartyPricingOption.findMany({
    where: { counterpartyId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const nextIds = new Set(
    options.map((option) => option.id).filter((value): value is string => Boolean(value)),
  );

  const toDelete = [...existingIds].filter((id) => !nextIds.has(id));
  if (toDelete.length > 0) {
    await db.counterpartyPricingOption.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  for (const option of options) {
    const data = {
      label: option.label,
      price: option.price,
      currency: option.currency,
      notes: option.notes,
      sortOrder: option.sortOrder,
      active: option.active,
    };

    if (option.id && existingIds.has(option.id)) {
      await db.counterpartyPricingOption.update({
        where: { id: option.id },
        data,
      });
      continue;
    }

    await db.counterpartyPricingOption.create({
      data: {
        id: crypto.randomUUID(),
        counterpartyId,
        ...data,
      },
    });
  }
}

export async function createCounterparty(input: CounterpartyInput): Promise<Counterparty> {
  const id = input.id ?? crypto.randomUUID();

  await db.counterparty.create({
    data: {
      id,
      name: input.name,
      notes: input.notes,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      wechatId: input.wechatId,
      shopUrl: input.shopUrl,
      active: input.active,
      sortOrder: input.sortOrder,
    },
  });

  await syncPricingOptions(id, input.pricingOptions);

  const created = await getCounterpartyById(id);
  if (!created) {
    throw new Error("Не удалось создать контрагента");
  }
  return created;
}

export async function updateCounterparty(
  id: string,
  input: CounterpartyInput,
): Promise<Counterparty> {
  await db.counterparty.update({
    where: { id },
    data: {
      name: input.name,
      notes: input.notes,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      wechatId: input.wechatId,
      shopUrl: input.shopUrl,
      active: input.active,
      sortOrder: input.sortOrder,
    },
  });

  await syncPricingOptions(id, input.pricingOptions);

  const updated = await getCounterpartyById(id);
  if (!updated) {
    throw new Error("Контрагент не найден");
  }
  return updated;
}

export async function deleteCounterparty(id: string): Promise<void> {
  await db.counterparty.delete({ where: { id } });
}
