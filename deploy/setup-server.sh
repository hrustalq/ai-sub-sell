#!/usr/bin/env bash
# One-time VPS bootstrap: user, directories, nginx, SSL, systemd, cron.
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo $0 <domain> [deploy-user]"
  exit 1
fi

DOMAIN="${1:-}"
DEPLOY_USER="${2:-ai-sub-sell}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-${3:-}}"
APP_ROOT="${APP_ROOT:-/opt/ai-sub-sell}"
APP_DIR="$APP_ROOT/app"
SHARED_DIR="$APP_ROOT/shared"
DATA_DIR="/var/lib/ai-sub-sell/data"
ENV_FILE="$SHARED_DIR/.env"
REPO_URL="${REPO_URL:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: sudo $0 <domain> [deploy-user]"
  echo "Example: sudo $0 ai-sub.store"
  exit 1
fi

echo "=== Server setup: $DOMAIN ==="

bash "$SCRIPT_DIR/check-deps.sh"

if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd --system --create-home --home-dir "/home/$DEPLOY_USER" --shell /bin/bash "$DEPLOY_USER"
  echo "Created user: $DEPLOY_USER"
fi

mkdir -p "$APP_ROOT" "$SHARED_DIR" "$DATA_DIR" "$SHARED_DIR/backups"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_ROOT" "$DATA_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$SCRIPT_DIR/env.production.example" "$ENV_FILE"
  sed -i "s|ai-sub.store|$DOMAIN|g" "$ENV_FILE"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE — edit secrets before going live."
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    echo "Clone the repo to $APP_DIR as $DEPLOY_USER, then re-run this script."
    echo "  sudo -u $DEPLOY_USER git clone <repo-url> $APP_DIR"
    exit 1
  fi
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$APP_DIR"
fi

# nginx
NGINX_SITE="/etc/nginx/sites-available/ai-sub-sell"
sed "s/__DOMAIN__/$DOMAIN/g" "$SCRIPT_DIR/nginx/ai-sub-sell.conf" >"$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/ai-sub-sell
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl reload nginx

# Initial certificate
if [[ ! -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
  if [[ -z "${CERTBOT_EMAIL}" ]]; then
    echo "Certbot email required. Either:"
    echo "  sudo CERTBOT_EMAIL=you@example.com bash $0 $DOMAIN"
    echo "  sudo bash $0 $DOMAIN ai-sub-sell you@example.com"
    exit 1
  fi
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" || {
    echo "certbot failed — check DNS and nginx, then re-run."
    exit 1
  }
fi

# Passwordless service restart for deploy user
SUDOERS_FILE="/etc/sudoers.d/ai-sub-sell-deploy"
sed "s|__DEPLOY_USER__|$DEPLOY_USER|g" "$SCRIPT_DIR/sudoers/ai-sub-sell-deploy" >"$SUDOERS_FILE"
chmod 440 "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE"

# systemd
UNIT_PATH="/etc/systemd/system/ai-sub-sell.service"
sed -e "s|__DEPLOY_USER__|$DEPLOY_USER|g" \
  -e "s|__APP_DIR__|$APP_DIR|g" \
  -e "s|__ENV_FILE__|$ENV_FILE|g" \
  "$SCRIPT_DIR/systemd/ai-sub-sell.service" >"$UNIT_PATH"

systemctl daemon-reload
systemctl enable ai-sub-sell

# SSL renewal cron
APP_ROOT="$APP_ROOT" bash "$SCRIPT_DIR/setup-cron.sh"

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo ""
echo "=== Server setup complete ==="
echo "1. Edit secrets: $ENV_FILE"
echo "2. Deploy as $DEPLOY_USER: APP_ROOT=$APP_ROOT $APP_DIR/deploy/deploy.sh"
echo "3. Point DNS A/AAAA record for $DOMAIN to this server"
