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
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"

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

if [[ -z "${DEPLOY_REEXECED:-}" ]]; then
  if [[ -f "$DB_PATH" ]]; then
    echo "Preserving existing database: $DB_PATH"
    backup="$SHARED_DIR/backups/production-$(date +%Y%m%d%H%M%S).db"
    cp -a "$DB_PATH" "$backup"
    echo "Backup: $backup"
    ls -1t "$SHARED_DIR/backups"/production-*.db 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | xargs -r rm -f
  else
    echo "No database yet at $DB_PATH — migrations will create schema."
  fi
fi

cd "$APP_DIR"

deploy_user="$(id -un)"
if [[ ! -w .git/objects ]]; then
  git_owner="$(stat -c '%U' .git 2>/dev/null || echo unknown)"
  echo "Cannot write to $APP_DIR/.git/objects (owned by $git_owner, running as $deploy_user)."
  echo "Fix on the VPS once as root, then re-run deploy:"
  echo "  sudo chown -R $deploy_user:$deploy_user $APP_DIR"
  echo "Do not run git pull or deploy.sh as root in $APP_DIR."
  echo "See docs/DEPLOY.md → Git ownership."
  exit 1
fi

if [[ -z "${DEPLOY_REEXECED:-}" && -f "$DEPLOY_SCRIPT" ]]; then
  DEPLOY_SCRIPT_HASH_BEFORE="$(sha256sum "$DEPLOY_SCRIPT" | cut -d' ' -f1)"
fi

echo "Fetching $GIT_REF..."
fetch_err="$(mktemp)"
if ! git fetch origin "$GIT_REF" 2>"$fetch_err"; then
  if grep -q 'insufficient permission for adding an object to repository database' "$fetch_err"; then
    git_owner="$(stat -c '%U' .git 2>/dev/null || echo unknown)"
    echo "git fetch failed: .git/objects is not writable by $deploy_user (owned by $git_owner)."
    echo "Fix on the VPS once as root:"
    echo "  sudo chown -R $deploy_user:$deploy_user $APP_DIR"
    echo "See docs/DEPLOY.md → Git ownership."
  elif grep -qE 'Permission denied \(publickey\)|Could not read from remote repository' "$fetch_err"; then
    echo "git fetch failed: VPS cannot authenticate to GitHub."
    echo "Configure a GitHub deploy key:"
    echo "  sudo bash $SCRIPT_DIR/setup-github-deploy-key.sh"
    echo "See docs/DEPLOY.md → GitHub deploy key."
  else
    cat "$fetch_err" >&2
    echo "git fetch failed. See docs/DEPLOY.md → Troubleshooting."
  fi
  rm -f "$fetch_err"
  exit 1
fi
rm -f "$fetch_err"
git checkout "$GIT_REF"
git pull --ff-only origin "$GIT_REF"

# bash keeps reading the script inode opened at start — after git pull, re-exec so new deploy logic runs.
if [[ -z "${DEPLOY_REEXECED:-}" && -n "${DEPLOY_SCRIPT_HASH_BEFORE:-}" && -f "$DEPLOY_SCRIPT" ]]; then
  deploy_script_hash_after="$(sha256sum "$DEPLOY_SCRIPT" | cut -d' ' -f1)"
  if [[ "$deploy_script_hash_after" != "$DEPLOY_SCRIPT_HASH_BEFORE" ]]; then
    echo "Deploy script updated — re-running with new version..."
    exec env DEPLOY_REEXECED=1 bash "$DEPLOY_SCRIPT"
  fi
fi

# Never delete or replace the data directory; only schema migrations touch the DB file.
echo "Installing dependencies..."
if ! pnpm install --frozen-lockfile; then
  echo "pnpm install failed — clearing modules cache and retrying once..."
  rm -rf node_modules node_modules/.modules.yaml
  pnpm install --frozen-lockfile
fi

if ! node -e "require('better-sqlite3')"; then
  echo "better-sqlite3 native module missing; rebuilding allowed packages..."
  pnpm rebuild better-sqlite3 prisma @prisma/engines
fi

echo "Generating Prisma client..."
pnpm exec prisma generate

echo "Applying database migrations..."
if [[ -d prisma/migrations ]] && compgen -G "prisma/migrations/*" >/dev/null; then
  pnpm run db:migrate
else
  echo "No migrations found; using db push (create migrations for production when ready)."
  pnpm run db:push
fi

service_stopped=0
APP_PORT="${PORT:-3000}"

sudo_systemctl() {
  if sudo -n systemctl "$@"; then
    return 0
  fi
  return 1
}

print_sudoers_fix() {
  echo "Passwordless sudo for systemctl is missing or outdated."
  echo "On the VPS as root, run once:"
  echo "  sudo bash $SCRIPT_DIR/apply-sudoers.sh $(id -un)"
  echo "See docs/DEPLOY.md → Deploy sudo."
}

wait_for_app() {
  local url="http://127.0.0.1:${APP_PORT}/"
  echo "Waiting for app at $url..."
  for _ in $(seq 1 90); do
    if curl -sf --max-time 2 "$url" >/dev/null 2>&1; then
      echo "App is responding."
      return 0
    fi
    sleep 1
  done
  echo "WARNING: app did not respond within 90s — check: sudo journalctl -u $SERVICE_NAME -n 50"
  return 1
}

if [[ "${STOP_SERVICE_FOR_BUILD:-0}" == "1" ]]; then
  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "Stopping $SERVICE_NAME to free memory for build (STOP_SERVICE_FOR_BUILD=1)..."
    if sudo_systemctl stop "$SERVICE_NAME"; then
      service_stopped=1
    else
      echo "WARNING: could not stop $SERVICE_NAME (continuing build — may OOM on small VPS)."
      print_sudoers_fix
    fi
  fi
else
  echo "Building while $SERVICE_NAME stays up (old version serves traffic until restart)."
  echo "Set STOP_SERVICE_FOR_BUILD=1 only if the build OOMs on a small VPS."
fi

echo "Memory before build:"
free -h || true

echo "Building Next.js..."
if ! pnpm run build; then
  build_status=$?
  if [[ "$build_status" -eq 137 ]] || [[ "$build_status" -eq 143 ]]; then
    echo ""
    echo "Build was killed (exit $build_status) — usually out of memory on small VPS instances."
    echo "Fix on the VPS once as root:"
    echo "  sudo bash $SCRIPT_DIR/setup-swap.sh"
    echo "See docs/DEPLOY.md → Build OOM."
  fi
  if [[ "$service_stopped" -eq 1 ]]; then
    echo "Restarting $SERVICE_NAME after failed build..."
    sudo_systemctl start "$SERVICE_NAME" || true
  fi
  exit "$build_status"
fi

echo "Restarting $SERVICE_NAME..."
if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
  if ! sudo_systemctl restart "$SERVICE_NAME"; then
    print_sudoers_fix
    exit 1
  fi
  wait_for_app || true
  sudo_systemctl status "$SERVICE_NAME" --no-pager || true
else
  echo "Service $SERVICE_NAME is not enabled. Run deploy/setup-server.sh first."
  exit 1
fi

echo "=== Deploy complete ==="
