const DEFAULT_SQLITE_URL = "file:./prisma/dev.db";

/** SQLite URL for Prisma and better-sqlite3 (dev default; production uses DATABASE_URL). */
export function getSqliteDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url?.startsWith("file:")) {
    return url;
  }
  return DEFAULT_SQLITE_URL;
}
