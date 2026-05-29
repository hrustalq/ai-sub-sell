#!/usr/bin/env bash
# Install Datadog Agent and collect ai-sub-sell logs from systemd journal.
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo DD_API_KEY=... bash $0"
  exit 1
fi

DD_API_KEY="${DD_API_KEY:-}"
DD_SITE="${DD_SITE:-datadoghq.com}"
SERVICE_NAME="${SERVICE_NAME:-ai-sub-sell}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-ai-sub-sell.service}"

if [[ -z "$DD_API_KEY" ]]; then
  echo "Set DD_API_KEY (Datadog → Organization Settings → API Keys)."
  exit 1
fi

echo "=== Datadog Agent setup (site: $DD_SITE) ==="

if ! command -v datadog-agent >/dev/null 2>&1; then
  DD_API_KEY="$DD_API_KEY" DD_SITE="$DD_SITE" bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"
else
  echo "Datadog Agent already installed."
fi

AGENT_ENV="/etc/datadog-agent/environment"
grep -q '^DD_API_KEY=' "$AGENT_ENV" 2>/dev/null || echo "DD_API_KEY=$DD_API_KEY" >>"$AGENT_ENV"
grep -q '^DD_SITE=' "$AGENT_ENV" 2>/dev/null || echo "DD_SITE=$DD_SITE" >>"$AGENT_ENV"

JOURNALD_CONF="/etc/datadog-agent/conf.d/journald.d/conf.yaml"
mkdir -p "$(dirname "$JOURNALD_CONF")"
cat >"$JOURNALD_CONF" <<EOF
logs:
  - type: journald
    source: nodejs
    service: ${SERVICE_NAME}
    include_units:
      - ${SYSTEMD_UNIT}
EOF

grep -q '^logs_enabled:' /etc/datadog-agent/datadog.yaml 2>/dev/null || {
  echo "logs_enabled: true" >>/etc/datadog-agent/datadog.yaml
}

usermod -aG systemd-journal dd-agent 2>/dev/null || true

systemctl enable datadog-agent
systemctl restart datadog-agent

echo ""
echo "=== Datadog Agent configured ==="
echo "Journal unit: ${SYSTEMD_UNIT}"
echo "Verify: datadog-agent status"
echo "Logs should appear in Datadog → Logs (source: nodejs, service: ${SERVICE_NAME})"
