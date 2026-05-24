# VPS deployment (nginx + Next.js, no Docker)

Production runs `pnpm build` and `pnpm start` behind nginx. SQLite lives **outside** the git tree so deploys never overwrite data.

## Architecture

```text
Internet → nginx (443) → Next.js :3000
                              ↓
                    /var/lib/ai-sub-sell/data/production.db
```

| Path | Purpose |
|------|---------|
| `/opt/ai-sub-sell/app` | Git clone (updated on each deploy) |
| `/opt/ai-sub-sell/shared/.env` | Secrets and `DATABASE_URL` |
| `/var/lib/ai-sub-sell/data/production.db` | Persistent SQLite database |
| `/opt/ai-sub-sell/shared/backups/` | Pre-migrate DB backups |

## 1. Server requirements

Ubuntu 22.04+ (or similar) with:

- Node.js ≥ 20, pnpm ≥ 9
- nginx, certbot + nginx plugin
- build-essential, python3 (for `better-sqlite3`)

Verify before setup:

```bash
./deploy/check-deps.sh
```

## 2. One-time server setup

On the VPS as root:

```bash
# export alone is not passed through sudo — inline it or use the 3rd argument:
sudo CERTBOT_EMAIL=you@example.com bash deploy/setup-server.sh ai-sub.store
# or:
sudo bash deploy/setup-server.sh ai-sub.store ai-sub-sell you@example.com

export REPO_URL=git@github.com:YOUR_ORG/ai-sub-sell.git   # optional; requires deploy key (see below)
```

Then edit `/opt/ai-sub-sell/shared/.env` (see `deploy/env.production.example`). Ensure:

```env
DATABASE_URL="file:/var/lib/ai-sub-sell/data/production.db"
BETTER_AUTH_URL="https://ai-sub.store"
NEXT_PUBLIC_BETTER_AUTH_URL="https://ai-sub.store"
```

First deploy as the deploy user:

```bash
sudo -u ai-sub-sell corepack enable
sudo -u ai-sub-sell corepack prepare pnpm@latest --activate
sudo -u ai-sub-sell bash /opt/ai-sub-sell/app/deploy/deploy.sh
```

If `pnpm install` reports `ERR_PNPM_IGNORED_BUILDS`, pull latest (uses `allowBuilds` in `pnpm-workspace.yaml`), then:

```bash
cd /opt/ai-sub-sell/app
sudo -u ai-sub-sell rm -rf node_modules
sudo -u ai-sub-sell pnpm install --frozen-lockfile
sudo -u ai-sub-sell bash deploy/deploy.sh
```

## 3. SSL renewal (cron)

`setup-server.sh` installs `/etc/cron.d/ai-sub-sell-ssl` (runs at 03:00 and 15:00). It executes `deploy/ssl-renew.sh`, which runs `certbot renew` and reloads nginx.

Manual test:

```bash
sudo /opt/ai-sub-sell/app/deploy/ssl-renew.sh
```

## 4. GitHub Actions

### CI (`ci.yml`)

Runs on pull requests and pushes to `main`: install, Prisma generate, lint, build.

### CD (`deploy.yml`)

On push to `main` (and manual `workflow_dispatch`), SSH into the VPS and run `deploy/deploy.sh`.

**Repository secrets** (Settings → Secrets → Actions):

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Server hostname or IP |
| `VPS_USER` | SSH user (e.g. `ai-sub-sell`) |
| `VPS_SSH_KEY` | Private key for deploy user |
| `VPS_APP_ROOT` | Optional; default `/opt/ai-sub-sell` |
| `VPS_SSH_PORT` | Optional; default `22` |

Use **GitHub Environment** `production` with required reviewers if you want approval gates.

Because `deploy.yml` sets `environment: production`, secrets can live in either place:

- **Repository secrets** — Settings → Secrets and variables → Actions
- **Environment secrets** — Settings → Environments → production → Environment secrets

If the same name exists in both, the environment value wins. An empty `VPS_SSH_KEY` in the environment overrides a valid repo secret.

### Two different SSH keys

| Key | Where private key lives | Where public key goes | Purpose |
|-----|------------------------|------------------------|---------|
| **Actions → VPS** | GitHub secret `VPS_SSH_KEY` | `/home/ai-sub-sell/.ssh/authorized_keys` | GitHub Actions SSH into the server |
| **VPS → GitHub** | `/home/ai-sub-sell/.ssh/id_ed25519_github` | Repo → Settings → Deploy keys | `git fetch` / `git pull` on the server |

Do not reuse the Actions key for GitHub pulls — GitHub Actions authenticates *to* the VPS; the VPS must separately authenticate *to* GitHub.

### GitHub Actions SSH key (VPS login)

```bash
sudo -u ai-sub-sell ssh-keygen -t ed25519 -f /home/ai-sub-sell/.ssh/id_ed25519 -N ""
cat /home/ai-sub-sell/.ssh/id_ed25519.pub >> /home/ai-sub-sell/.ssh/authorized_keys
# Store id_ed25519 (private) in GitHub secret VPS_SSH_KEY
```

Paste the **entire private key** into `VPS_SSH_KEY`, including the `BEGIN`/`END` lines and real newlines (not literal `\n`). Use the private key file, not the `.pub` file. Keys with a passphrase are not supported unless you also configure `passphrase` on the action.

### GitHub deploy key (git pull on VPS)

If `deploy.sh` fails with `git@github.com: Permission denied (publickey)`, the deploy user cannot pull the repo:

```bash
sudo bash /opt/ai-sub-sell/app/deploy/setup-github-deploy-key.sh
```

Copy the printed public key into **GitHub → your repo → Settings → Deploy keys → Add deploy key** (read-only). Then test:

```bash
sudo -u ai-sub-sell ssh -T git@github.com
cd /opt/ai-sub-sell/app && sudo -u ai-sub-sell git fetch origin main
```

`setup-server.sh` grants passwordless `systemctl restart ai-sub-sell` via `/etc/sudoers.d/ai-sub-sell-deploy`.

### SSH deploy troubleshooting

| Log message | Fix |
|-------------|-----|
| `ssh: no key found` | `VPS_SSH_KEY` is missing, empty, or not a valid private key PEM/OpenSSH block |
| `unable to authenticate` | Public key not in `~/.ssh/authorized_keys` on the VPS, wrong `VPS_USER`, or wrong key pair |
| `git@github.com: Permission denied` | Add a **deploy key** on the repo; run `deploy/setup-github-deploy-key.sh` on the VPS |
| Missing secrets preflight | Create `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` in repo or `production` environment secrets |

## 5. Manual deploy

```bash
cd /opt/ai-sub-sell/app
git pull
bash deploy/deploy.sh
```

Deploy will:

1. Back up the existing DB (keeps last 10 backups)
2. Run migrations (`db:migrate` if `prisma/migrations` exists, else `db:push`)
3. Build and restart the systemd unit

It **does not** delete or replace `/var/lib/ai-sub-sell/data/`.

## 6. Database safety

- Production DB path is configured only via `DATABASE_URL` in `shared/.env`.
- `prisma/dev.db` remains for local development and is gitignored.
- Each deploy copies a timestamped backup before migrations.
- Do not run `git clean -fdx` on paths containing production data.

## 7. Troubleshooting

```bash
sudo journalctl -u ai-sub-sell -f
sudo nginx -t && sudo systemctl status nginx
./deploy/check-deps.sh
```

OAuth redirect URIs must use your production `BETTER_AUTH_URL` (e.g. `https://ai-sub.store/api/auth/callback/google`).
