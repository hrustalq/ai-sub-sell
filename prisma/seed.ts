import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { seedAdminUser } from "@/lib/admin/seed";
import { getSqliteDatabaseUrl } from "@/lib/database-url";
import { createLogger, logError } from "@/lib/logger-script";
import { seedDemoOrders } from "@/lib/orders/seed";
import { buildDefaultPlans, DEFAULT_PROVIDERS } from "@/lib/plans/catalog";
import { LEGACY_PLAN_IDS, planToDbRecord } from "@/lib/plans/seed";

const log = createLogger("seed");

const adapter = new PrismaBetterSqlite3({ url: getSqliteDatabaseUrl() });
const db = new PrismaClient({ adapter });

async function seedProvidersCatalog() {
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

async function main() {
  await seedProvidersCatalog();

  const providers = await db.planProvider.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  const defaults = buildDefaultPlans(
    providers.map((provider) => ({
      id: provider.id,
      label: provider.label,
      description: provider.description,
      sortOrder: provider.sortOrder,
      active: provider.active,
    })),
  );

  for (const plan of defaults) {
    await db.plan.upsert({
      where: { id: plan.id },
      create: planToDbRecord(plan),
      update: planToDbRecord(plan),
    });
  }

  await db.plan.updateMany({
    where: { id: { in: [...LEGACY_PLAN_IDS] } },
    data: { active: false },
  });

  log.info({ providers: providers.length, plans: defaults.length }, "catalog synced");

  await seedAdminUser(db);
  await seedDemoOrders(db);
}

main()
  .catch((err) => {
    logError(log, "seed failed", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
