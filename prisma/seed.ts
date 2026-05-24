import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { seedAdminUser } from "@/lib/admin/seed";
import { seedDemoOrders } from "@/lib/orders/seed";
import { buildDefaultPlans } from "@/lib/plans/catalog";
import { LEGACY_PLAN_IDS, planToDbRecord } from "@/lib/plans/seed";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const db = new PrismaClient({ adapter });

async function main() {
  const defaults = buildDefaultPlans();

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

  console.log(`Синхронизировано тарифов: ${defaults.length}`);

  await seedAdminUser(db);
  await seedDemoOrders(db);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
