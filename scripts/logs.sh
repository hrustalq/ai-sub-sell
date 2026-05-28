#!/usr/bin/env bash
# View ai-sub-sell production logs from systemd journal (run on the VPS).
#
# Usage:
#   pnpm logs              # follow live logs
#   pnpm logs:follow       # same as logs
#   pnpm logs:tail         # last 200 lines
#   pnpm logs:errors       # errors and above (last 24h)
#   pnpm logs:since        # since time (default: 1 hour ago)
#   pnpm logs:status       # service unit status
#
# Override unit: LOG_UNIT=ai-sub-sell pnpm logs

set -euo pipefail

UNIT="${LOG_UNIT:-ai-sub-sell}"
LINES="${LOG_LINES:-200}"

cmd="${1:-follow}"
shift || true

if ! command -v journalctl >/dev/null 2>&1; then
  echo "journalctl not found — run this on the production VPS (systemd)." >&2
  exit 1
fi

case "$cmd" in
  follow|f)
    exec journalctl -u "$UNIT" -f --no-pager -o cat "$@"
    ;;
  tail|t)
    exec journalctl -u "$UNIT" -n "$LINES" --no-pager -o cat "$@"
    ;;
  errors|err|e)
    exec journalctl -u "$UNIT" -p err..alert --since "24 hours ago" --no-pager -o cat "$@"
    ;;
  since|s)
    since="${1:-1 hour ago}"
    exec journalctl -u "$UNIT" --since "$since" --no-pager -o cat "${@:2}"
    ;;
  json)
    exec journalctl -u "$UNIT" -f --no-pager -o json "$@"
    ;;
  status|st)
    systemctl status "$UNIT" --no-pager "$@"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Commands: follow, tail, errors, since [time], json, status" >&2
    exit 1
    ;;
esac
