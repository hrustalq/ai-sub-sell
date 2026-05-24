#!/usr/bin/env bash
# Install cron job for SSL renewal (run as root).
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="${APP_ROOT:-/opt/ai-sub-sell}"
SSL_SCRIPT="${SSL_SCRIPT:-$APP_ROOT/app/deploy/ssl-renew.sh}"
CRON_FILE="/etc/cron.d/ai-sub-sell-ssl"
LOG_FILE="/var/log/ai-sub-sell-ssl-renew.log"

if [[ ! -f "$SSL_SCRIPT" ]]; then
  SSL_SCRIPT="$SCRIPT_DIR/ssl-renew.sh"
fi

if [[ ! -f "$SSL_SCRIPT" ]]; then
  echo "SSL renew script not found. Clone the app to $APP_ROOT/app or set SSL_SCRIPT."
  exit 1
fi

chmod +x "$SSL_SCRIPT"

cat >"$CRON_FILE" <<EOF
# Renew Let's Encrypt certs twice daily; reload nginx on success.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

0 3,15 * * * root ${SSL_SCRIPT} >> ${LOG_FILE} 2>&1
EOF

chmod 644 "$CRON_FILE"

touch "$LOG_FILE"
chmod 640 "$LOG_FILE"

echo "Installed cron: $CRON_FILE"
echo "Logs: $LOG_FILE"
crontab -l 2>/dev/null || true
echo "Cron entries in /etc/cron.d/ are loaded automatically by cron."
