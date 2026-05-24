#!/usr/bin/env bash
# One-time: let the deploy user pull from GitHub over SSH (git@github.com:...).
# Run on the VPS as root after cloning the repo with an SSH remote.
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-ai-sub-sell}"
KEY_PATH="/home/$DEPLOY_USER/.ssh/id_ed25519_github"
SSH_CONFIG="/home/$DEPLOY_USER/.ssh/config"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "User $DEPLOY_USER does not exist."
  exit 1
fi

mkdir -p "/home/$DEPLOY_USER/.ssh"
chmod 700 "/home/$DEPLOY_USER/.ssh"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"

if [[ ! -f "$KEY_PATH" ]]; then
  sudo -u "$DEPLOY_USER" ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "$DEPLOY_USER@$(hostname)-github-deploy"
fi
chmod 600 "$KEY_PATH"
chown "$DEPLOY_USER:$DEPLOY_USER" "$KEY_PATH" "${KEY_PATH}.pub"

if ! grep -q 'Host github.com' "$SSH_CONFIG" 2>/dev/null; then
  sudo -u "$DEPLOY_USER" tee -a "$SSH_CONFIG" >/dev/null <<EOF

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
EOF
fi
chmod 600 "$SSH_CONFIG"
chown "$DEPLOY_USER:$DEPLOY_USER" "$SSH_CONFIG"

APP_DIR="${APP_DIR:-/opt/ai-sub-sell/app}"
if [[ -d "$APP_DIR/.git" ]]; then
  sudo -u "$DEPLOY_USER" git config --global --add safe.directory "$APP_DIR"
fi

echo ""
echo "=== GitHub deploy key (read-only) ==="
echo "1. Open your repo on GitHub → Settings → Deploy keys → Add deploy key"
echo "2. Title: VPS $DEPLOY_USER"
echo "3. Paste this public key (Allow write access: OFF):"
echo ""
cat "${KEY_PATH}.pub"
echo ""
echo "4. Test as $DEPLOY_USER:"
echo "   sudo -u $DEPLOY_USER ssh -T git@github.com"
echo "   (Hi <user>! You've successfully authenticated... is OK)"
echo ""
