#!/usr/bin/env bash
# Install or refresh passwordless sudo rules for the deploy user (run once as root on the VPS).
# Usage: sudo bash deploy/apply-sudoers.sh [deploy-user]
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0 [deploy-user]"
  exit 1
fi

DEPLOY_USER="${1:-ai-sub-sell}"
SERVICE_NAME="${SERVICE_NAME:-ai-sub-sell}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SYSTEMCTL="$(command -v systemctl || true)"
NGINX="$(command -v nginx || true)"

if [[ -z "$SYSTEMCTL" ]]; then
  echo "systemctl not found in PATH"
  exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "User not found: $DEPLOY_USER"
  exit 1
fi

SUDOERS_FILE="/etc/sudoers.d/ai-sub-sell-deploy"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

{
  echo "# Managed by $SCRIPT_DIR/apply-sudoers.sh — do not edit by hand."
  echo "# Allow $DEPLOY_USER to control $SERVICE_NAME without a password."
  echo "$DEPLOY_USER ALL=(root) NOPASSWD: \\"
  echo "  $SYSTEMCTL stop $SERVICE_NAME, \\"
  echo "  $SYSTEMCTL start $SERVICE_NAME, \\"
  echo "  $SYSTEMCTL restart $SERVICE_NAME, \\"
  echo "  $SYSTEMCTL status $SERVICE_NAME, \\"
  echo "  $SYSTEMCTL reload $SERVICE_NAME"
  if [[ -n "$NGINX" ]]; then
    echo "$DEPLOY_USER ALL=(root) NOPASSWD: $NGINX -t"
  fi
} >"$TMP"

install -m 440 -o root -g root "$TMP" "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE"

echo "Installed $SUDOERS_FILE for user $DEPLOY_USER (systemctl: $SYSTEMCTL)"
