#!/usr/bin/env bash
# Verify required tools and libraries are available before server setup or deploy.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

require_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name: $(command -v "$name")"
  else
    echo -e "${RED}✗${NC} $name: not found"
    errors=$((errors + 1))
  fi
}

require_min_version() {
  local label="$1"
  local current="$2"
  local required="$3"
  if printf '%s\n%s\n' "$required" "$current" | sort -V -C 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $label: $current (>= $required)"
  else
    echo -e "${RED}✗${NC} $label: $current (need >= $required)"
    errors=$((errors + 1))
  fi
}

echo "=== NeuroPort — dependency check ==="

require_cmd git
require_cmd curl
require_cmd nginx
require_cmd certbot
require_cmd systemctl
require_cmd node
require_cmd pnpm
require_cmd python3

# Native module build chain for better-sqlite3
for tool in make g++; do
  require_cmd "$tool"
done

if command -v node >/dev/null 2>&1; then
  node_version="$(node -p "process.versions.node")"
  require_min_version "Node.js" "$node_version" "20.0.0"
fi

if command -v pnpm >/dev/null 2>&1; then
  pnpm_version="$(pnpm --version)"
  require_min_version "pnpm" "$pnpm_version" "9.0.0"
fi

if command -v nginx >/dev/null 2>&1; then
  nginx -t >/dev/null 2>&1 && echo -e "${GREEN}✓${NC} nginx config test passed" || {
    echo -e "${RED}✗${NC} nginx -t failed (fix config before deploy)"
    errors=$((errors + 1))
  }
fi

if command -v certbot >/dev/null 2>&1; then
  if certbot plugins 2>/dev/null | grep -q nginx; then
    echo -e "${GREEN}✓${NC} certbot nginx plugin"
  else
    echo -e "${RED}✗${NC} certbot nginx plugin (install certbot python3-certbot-nginx)"
    errors=$((errors + 1))
  fi
fi

echo ""
if [[ "$errors" -gt 0 ]]; then
  echo -e "${RED}Dependency check failed ($errors issue(s)).${NC}"
  echo "Ubuntu/Debian example:"
  echo "  sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx git curl build-essential python3"
  echo "  corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
fi

echo -e "${GREEN}All dependencies OK.${NC}"
