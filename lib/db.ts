import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { getSqliteDatabaseUrl } from "./database-url";
import logger from "./logger";

const adapter = new PrismaBetterSqlite3({ url: getSqliteDatabaseUrl() });

const db = new PrismaClient({ adapter, log: ['query', 'info', 'warn', 'error'] });

db.$on('query', (event) => {
  logger.info(event);
});

db.$on('error', (event) => {
  logger.error(event);
});

db.$on('info', (event) => {
  logger.info(event);
});

db.$on('warn', (event) => {
  logger.warn(event);
});

export default db;