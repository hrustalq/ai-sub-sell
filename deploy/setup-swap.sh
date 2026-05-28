#!/usr/bin/env bash
# One-time: add swap so `next build` (TypeScript check) survives on 1 GB VPS plans.
set -euo pipefail

SWAP_FILE="${SWAP_FILE:-/swapfile}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

if swapon --show | grep -q .; then
  echo "Swap already enabled:"
  swapon --show
  free -h
  exit 0
fi

if [[ -f "$SWAP_FILE" ]]; then
  echo "Swap file exists at $SWAP_FILE but is not active — enabling..."
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" >/dev/null
  swapon "$SWAP_FILE"
else
  echo "Creating ${SWAP_SIZE} swap at $SWAP_FILE..."
  fallocate -l "$SWAP_SIZE" "$SWAP_FILE" || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=2048 status=progress
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE"
  swapon "$SWAP_FILE"
fi

if ! grep -qF "$SWAP_FILE" /etc/fstab 2>/dev/null; then
  echo "$SWAP_FILE none swap sw 0 0" >>/etc/fstab
  echo "Added $SWAP_FILE to /etc/fstab"
fi

echo ""
echo "Swap enabled:"
swapon --show
free -h
