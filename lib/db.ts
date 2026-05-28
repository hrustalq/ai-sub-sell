import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { getSqliteDatabaseUrl } from "./database-url";
import { createLogger } from "./logger";
import { prismaQueryLoggingEnabled } from "./logger/core";

const log = createLogger("prisma");

const adapter = new PrismaBetterSqlite3({ url: getSqliteDatabaseUrl() });

const prismaLogLevels = prismaQueryLoggingEnabled()
  ? (["query", "info", "warn", "error"] as const)
  : (["warn", "error"] as const);

const db = new PrismaClient({ adapter, log: [...prismaLogLevels] });

db.$on("error", (event) => {
  log.error(event, "prisma error");
});

db.$on("warn", (event) => {
  log.warn(event, "prisma warn");
});

if (prismaQueryLoggingEnabled()) {
  db.$on("query", (event) => {
    log.debug(event, "prisma query");
  });

  db.$on("info", (event) => {
    log.info(event, "prisma info");
  });
}

export default db;
