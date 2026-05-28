# Telegram bots

Two bots mirror the website: **sell** (buyers) and **support** (staff).

## Sell bot

- Browse catalog (Codex / Cursor / Claude, tiers, durations)
- Checkout via YooKassa (same flow as the site)
- List orders, pay pending orders, chat with support
- Notifications on payment, support replies, and fulfillment

Commands: `/start`, `/catalog`, `/orders`, `/support`, `/email`, `/help`

Support bot commands: `/start`, `/orders`, `/chats`, `/help` (plus `/order_<uuid>` and `/chat_<uuid>` to open a specific thread).

Command hints appear in Telegram’s menu when you tap `/` (registered automatically on startup and when running `pnpm telegram:poll`).

Email linking requires a 6-digit verification code sent to the inbox.

## Support bot

- Order list with unread indicators (same data as `/admin/support` on the web)
- General conversations not tied to orders (`/admin/support/chats`)
- Open order, reply in chat, paste fulfillment credentials
- Notifications for new Telegram orders and buyer messages

Access is limited to staff with the support role, **core admins** (`CORE_ADMIN_EMAILS`), and admins who linked their Telegram ID in the admin panel (**Админ → Telegram**), plus legacy IDs in `TELEGRAM_SUPPORT_USER_IDS`. Staff must send `/start` to the support bot once so their `chat_id` is stored.

Commands: `/start`, `/orders`, `/order_<uuid>`, `/chats`, `/chat_<uuid>`, `/help`

## Sell bot — general support chat

Buyers can open a support conversation not linked to any order via `/support` in the sell bot. Order chats (`💬 Чат с поддержкой` inside a specific order) remain separate and continue to work as before.

## Environment

```env
TELEGRAM_SELL_BOT_TOKEN=...
TELEGRAM_SUPPORT_BOT_TOKEN=...
TELEGRAM_SUPPORT_USER_IDS=123456789,987654321
TELEGRAM_WEBHOOK_SECRET=random-secret-with-letters-digits-underscore-hyphen-only
```

`SITE_URL` / `BETTER_AUTH_URL` must be the public HTTPS origin used for webhooks and payment return URLs.

## Local development

1. Create bots in [@BotFather](https://t.me/BotFather).
2. Add tokens and your Telegram user ID to `.env`.
3. Run long polling (no HTTPS):

```bash
pnpm telegram:poll
```

## Production webhooks

In production, the app registers Telegram webhooks automatically on server startup when `SITE_URL` is HTTPS and bot tokens are configured. Restarting the service after deploy is enough.

You can still register manually:

On the VPS, run from `/opt/ai-sub-sell/app`. Scripts load env from `../shared/.env` automatically (same as systemd). You can also set `ENV_FILE=/path/to/.env`.

```bash
cd /opt/ai-sub-sell/app
pnpm telegram:check
pnpm telegram:webhooks
```

This registers:

- `{SITE_URL}/api/telegram/sell/webhook`
- `{SITE_URL}/api/telegram/support/webhook`

Set `TELEGRAM_AUTO_WEBHOOKS=false` to disable startup registration, or `TELEGRAM_AUTO_WEBHOOKS=true` to enable it outside production (for example with an HTTPS tunnel).

If `TELEGRAM_WEBHOOK_SECRET` is set, the same value is sent to Telegram and must match the `X-Telegram-Bot-Api-Secret-Token` header. Telegram allows only `A-Z`, `a-z`, `0-9`, `_`, and `-` (1–256 chars). Generate one with:

```bash
openssl rand -hex 32
```

## Troubleshooting webhooks

### `Request timed out after 10000 ms` in journalctl

grammY’s default webhook timeout is 10 seconds. Real updates (DB, email verification, replies) can exceed that and Telegram sees HTTP 500. The app uses a 55s timeout instead.

After deploying the fix, restart the service and re-check:

```bash
sudo systemctl restart ai-sub-sell
sleep 5
pnpm telegram:check
```

### `last webhook error` in `pnpm telegram:check`

This comes from Telegram’s `getWebhookInfo` and reflects the **last failed delivery**, not the current config. If manual curl with the secret returns HTTP 200, registration is fine — Telegram clears the error after the next successful update.

Test locally on the VPS:

```bash
source /opt/ai-sub-sell/shared/.env
curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
  -X POST "https://ai-sub.store/api/telegram/sell/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: $TELEGRAM_WEBHOOK_SECRET" \
  -d '{"update_id":1}'
```

Send a new message to the bot (or wait for Telegram to retry pending updates) and run `pnpm telegram:check` again.

### `Connection timed out` right after restart

Expected if `telegram:check` runs while the service is still starting. Wait a few seconds after `systemctl restart` before checking.

## Notes

- Orders created in Telegram store `buyerTelegramUserId` for notifications.
- Web checkout is unchanged; Telegram uses the same `createCheckoutOrder` and order chat tables.
- YooKassa webhook still drives payment status; the sell bot is notified after `payment.succeeded`.
