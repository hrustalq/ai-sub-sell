#!/usr/bin/env bash
# Apply Prisma migrations on production. Baselines DBs created via db push (P3005).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

DB_PATH="${DATABASE_URL#file:}"
if [[ "$DB_PATH" != /* ]]; then
  echo "DATABASE_URL must be an absolute file path (got: $DATABASE_URL)"
  exit 1
fi

sqlite_query() {
  node -e "
    const Database = require('better-sqlite3');
    const path = process.env.DB_PATH;
    if (!path) process.exit(1);
    const db = new Database(path, { readonly: true });
    try {
      const sql = process.env.SQL;
      const row = db.prepare(sql).get();
      db.close();
      process.exit(row ? 0 : 1);
    } catch {
      db.close();
      process.exit(1);
    }
  "
}

order_table_exists() {
  export SQL="SELECT 1 FROM sqlite_master WHERE type='table' AND name='order' LIMIT 1"
  sqlite_query
}

order_table_has_column() {
  export SQL="SELECT 1 FROM pragma_table_info('order') WHERE name='${1}' LIMIT 1"
  sqlite_query
}

list_pending_migrations() {
  find prisma/migrations -mindepth 1 -maxdepth 1 -type d ! -name '.*' 2>/dev/null | sort | while read -r dir; do
    [[ -f "$dir/migration.sql" ]] || continue
    basename "$dir"
  done
}

baseline_existing_database() {
  echo "Database has schema but no Prisma migration history (P3005) — baselining..."

  if [[ ! -f "$DB_PATH" ]] || ! order_table_exists; then
    echo "Database empty or missing tables — applying full schema via db push."
    pnpm exec prisma db push
  elif order_table_has_column orderNumber; then
    echo "Column order.orderNumber already exists — recording migrations only."
  else
    echo "Applying pending migration SQL..."
    while IFS= read -r name; do
      [[ -n "$name" ]] || continue
      sql="prisma/migrations/${name}/migration.sql"
      echo "  → $name"
      pnpm exec prisma db execute --file "$sql"
    done < <(list_pending_migrations)
  fi

  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    echo "Marking applied: $name"
    pnpm exec prisma migrate resolve --applied "$name"
  done < <(list_pending_migrations)
}

apply_migrations() {
  if ! [[ -d prisma/migrations ]] || ! compgen -G "prisma/migrations/*/migration.sql" >/dev/null; then
    echo "No migrations found; using prisma db push."
    pnpm exec prisma db push
    return
  fi

  set +e
  migrate_log="$(mktemp)"
  pnpm exec prisma migrate deploy 2>&1 | tee "$migrate_log"
  migrate_code=${PIPESTATUS[0]}
  set -e

  if [[ "$migrate_code" -eq 0 ]]; then
    rm -f "$migrate_log"
    return 0
  fi

  if grep -q 'P3005' "$migrate_log"; then
    rm -f "$migrate_log"
    export DB_PATH
    baseline_existing_database
    pnpm exec prisma migrate deploy
    return 0
  fi

  rm -f "$migrate_log"
  return "$migrate_code"
}

export DB_PATH
apply_migrations
