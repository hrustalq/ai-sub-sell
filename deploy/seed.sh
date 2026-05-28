#!/usr/bin/env bash
# Production seed: sync catalog, ensure admin user, optional demo data.
# Safe to re-run — uses upserts, does not wipe the database.
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

APP_ROOT="${APP_ROOT:-/opt/ai-sub-sell}"
APP_DIR="${APP_DIR:-$APP_ROOT/app}"
SHARED_DIR="${SHARED_DIR:-$APP_ROOT/shared}"
DATA_DIR="${DATA_DIR:-/var/lib/ai-sub-sell/data}"
ENV_FILE="${ENV_FILE:-$SHARED_DIR/.env}"

# Skip demo buyer/orders by default on production (override with SEED_SKIP_DEMO_ORDERS=0).
export SEED_SKIP_DEMO_ORDERS="${SEED_SKIP_DEMO_ORDERS:-1}"

echo "=== Seed: $(date -Iseconds) ==="
echo "APP_DIR=$APP_DIR"
echo "DATA_DIR=$DATA_DIR"
echo "SEED_SKIP_DEMO_ORDERS=$SEED_SKIP_DEMO_ORDERS"

if [[ ! -d "$APP_DIR" ]]; then
  echo "App directory not found: $APP_DIR"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy deploy/env.production.example and configure secrets."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export NODE_ENV=production
export DATABASE_URL="${DATABASE_URL:-file:${DATA_DIR}/production.db}"

DB_PATH="${DATABASE_URL#file:}"
if [[ "$DB_PATH" != /* ]]; then
  echo "Production DATABASE_URL must be an absolute file path (got: $DATABASE_URL)"
  exit 1
fi

if [[ -z "${ADMIN_EMAIL:-}" && -z "${ADMIN_EMAILS:-}" ]]; then
  echo "WARNING: ADMIN_EMAIL / ADMIN_EMAILS not set in $ENV_FILE."
  echo "Seed will use default admin credentials from lib/admin/seed.ts — set real values in .env first."
fi

mkdir -p "$DATA_DIR"
chmod 700 "$DATA_DIR"

cd "$APP_DIR"

if [[ ! -d node_modules ]]; then
  echo "node_modules missing — run deploy/deploy.sh or pnpm install first."
  exit 1
fi

echo "Generating Prisma client..."
pnpm exec prisma generate

echo "Running seed..."
pnpm run db:seed

echo "=== Seed complete ==="
