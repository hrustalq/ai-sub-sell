#!/usr/bin/env bash
# Renew Let's Encrypt certificates and reload nginx.
set -euo pipefail

LOG_TAG="ai-sub-sell-ssl"

log() {
  echo "[$(date -Iseconds)] [$LOG_TAG] $*"
}

if ! command -v certbot >/dev/null 2>&1; then
  log "certbot not found"
  exit 1
fi

log "Starting certificate renewal"
certbot renew --quiet --deploy-hook "systemctl reload nginx"

if systemctl is-active --quiet nginx; then
  log "nginx reloaded via certbot deploy-hook"
else
  log "nginx is not active; attempting reload"
  systemctl reload nginx || systemctl start nginx
fi

log "Certificate renewal finished"
