import "server-only";

import db from "@/lib/db";
import { buildDefaultPlans } from "@/lib/plans/catalog";
import { planToDbRecord } from "@/lib/plans/seed";
import { seedProvidersIfEmpty, getAllProviders } from "@/lib/plans/providers";
import type { Plan } from "@/lib/plans/types";

type PlanRow = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  limits: string;
  tag: string | null;
  badge: string | null;
  highlight: boolean;
  active: boolean;
  sortOrder: number;
  provider: string;
  tier: string;
  tierLabel: string;
  durationMonths: number;
  compareAtPrice: number | null;
};

export function mapPlanRow(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    currency: row.currency,
    period: row.period,
    limits: JSON.parse(row.limits) as string[],
    tag: row.tag,
    badge: row.badge,
    highlight: row.highlight,
    active: row.active,
    sortOrder: row.sortOrder,
    provider: row.provider,
    tier: row.tier,
    tierLabel: row.tierLabel,
    durationMonths: row.durationMonths,
    compareAtPrice: row.compareAtPrice,
  };
}

export async function getPlans(): Promise<Plan[]> {
  const rows = await db.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapPlanRow);
}

export async function getAllPlans(): Promise<Plan[]> {
  const rows = await db.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapPlanRow);
}

export async function getPlan(id: string): Promise<Plan | null> {
  const row = await db.plan.findFirst({
    where: { id, active: true },
  });
  return row ? mapPlanRow(row) : null;
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const row = await db.plan.findUnique({ where: { id } });
  return row ? mapPlanRow(row) : null;
}

export async function seedPlansCatalog(): Promise<void> {
  await seedProvidersIfEmpty();
  const providers = await getAllProviders();
  const defaults = buildDefaultPlans(providers);

  for (const plan of defaults) {
    await db.plan.upsert({
      where: { id: plan.id },
      create: planToDbRecord(plan),
      update: planToDbRecord(plan),
    });
  }
}

export async function seedPlansIfEmpty(): Promise<void> {
  await seedProvidersIfEmpty();
  const count = await db.plan.count();
  if (count === 0) {
    await seedPlansCatalog();
  }
}
