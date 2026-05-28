/**
 * Logger for CLI scripts and Prisma seed (no `server-only` guard).
 * Prefer `@/lib/logger` in Next.js server code.
 */
export {
  createLogger,
  getRootLogger,
  logError,
  prismaQueryLoggingEnabled,
} from "./logger/core";
