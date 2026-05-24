#!/usr/bin/env bash
# Production deploy: pull code, migrate DB (without overwriting data), build, restart.
set -euo pipefail

# Avoid interactive Corepack download prompt when deploy runs as a non-root user.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

APP_ROOT="${APP_ROOT:-/opt/ai-sub-sell}"
APP_DIR="${APP_DIR:-$APP_ROOT/app}"
SHARED_DIR="${SHARED_DIR:-$APP_ROOT/shared}"
DATA_DIR="${DATA_DIR:-/var/lib/ai-sub-sell/data}"
ENV_FILE="${ENV_FILE:-$SHARED_DIR/.env}"
SERVICE_NAME="${SERVICE_NAME:-ai-sub-sell}"
GIT_REF="${GIT_REF:-main}"
BACKUP_KEEP="${BACKUP_KEEP:-10}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Deploy: $(date -Iseconds) ==="
echo "APP_DIR=$APP_DIR"
echo "DATA_DIR=$DATA_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Git repository not found at $APP_DIR"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy deploy/env.production.example and configure secrets."
  exit 1
fi

# Optional: fail fast if server deps are missing
if [[ "${SKIP_DEPS_CHECK:-0}" != "1" ]]; then
  bash "$SCRIPT_DIR/check-deps.sh"
fi

mkdir -p "$DATA_DIR" "$SHARED_DIR/backups"
chmod 700 "$DATA_DIR"

# Load production env (DATABASE_URL may already be set in .env)
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

if [[ -f "$DB_PATH" ]]; then
  echo "Preserving existing database: $DB_PATH"
  backup="$SHARED_DIR/backups/production-$(date +%Y%m%d%H%M%S).db"
  cp -a "$DB_PATH" "$backup"
  echo "Backup: $backup"
  ls -1t "$SHARED_DIR/backups"/production-*.db 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | xargs -r rm -f
else
  echo "No database yet at $DB_PATH — migrations will create schema."
fi

cd "$APP_DIR"

echo "Fetching $GIT_REF..."
git fetch origin "$GIT_REF"
git checkout "$GIT_REF"
git pull --ff-only origin "$GIT_REF"

# Never delete or replace the data directory; only schema migrations touch the DB file.
echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Generating Prisma client..."
pnpm exec prisma generate

echo "Applying database migrations..."
if [[ -d prisma/migrations ]] && compgen -G "prisma/migrations/*" >/dev/null; then
  pnpm run db:migrate
else
  echo "No migrations found; using db push (create migrations for production when ready)."
  pnpm run db:push
fi

echo "Building Next.js..."
pnpm run build

echo "Restarting $SERVICE_NAME..."
if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl --no-pager status "$SERVICE_NAME" || true
else
  echo "Service $SERVICE_NAME is not enabled. Run deploy/setup-server.sh first."
  exit 1
fi

echo "=== Deploy complete ==="
