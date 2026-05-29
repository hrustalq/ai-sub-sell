# Telegram bot

One bot handles sales and support: catalog, checkout, buyer orders, and staff workflows.

## Buyers

- Browse catalog (Codex / Cursor / Claude, tiers, durations)
- Checkout via YooKassa (same flow as the site)
- List orders, pay pending orders, chat with support
- General support chat via `/support` (not tied to an order)
- Notifications on payment, support replies, and fulfillment

Commands: `/start`, `/catalog`, `/orders`, `/support`, `/email`, `/help`

Email linking requires a 6-digit verification code sent to the inbox.

## Staff (support)

- Order list with unread indicators (`/inbox` — same data as `/admin/support` on the web)
- General conversations not tied to orders (`/tickets` — `/admin/support/chats`)
- Open order, reply in chat, paste fulfillment credentials
- Notifications for new Telegram orders and buyer messages

Access is limited to staff with the support role, **core admins** (`CORE_ADMIN_EMAILS`), and admins who linked their Telegram ID in the admin panel (**Админ → Telegram**), plus legacy IDs in `TELEGRAM_SUPPORT_USER_IDS`. Staff must send `/start` to the bot once so their `chat_id` is stored.

Staff commands: `/inbox`, `/tickets`, `/staff_help`, `/order_<uuid>`, `/chat_<uuid>` (deep links from notifications).

Command hints appear in Telegram’s menu when you tap `/` (registered automatically on startup and when running `pnpm telegram:poll`).

## Environment

```env
TELEGRAM_SELL_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=YourShopBot
TELEGRAM_SUPPORT_USER_IDS=123456789,987654321
TELEGRAM_WEBHOOK_SECRET=random-secret-with-letters-digits-underscore-hyphen-only
```

`TELEGRAM_BOT_USERNAME` is the public @username (no `@`) — used for buyer links on the website order page (`?start=order_<uuid>`).

**Existing database after upgrade:** production deploy runs migrations automatically (`20260529120000_add_order_number` adds and backfills `orderNumber`). First deploy on a DB that used `db push` is baselined in `deploy/migrate-db.sh`.

## Website buyers

- Each order gets a human-readable number (e.g. `ABCD-EFGH`) on `/orders/<id>` and in emails.
- Credentials appear on the order page and are emailed when staff issues fulfillment.
- Order chat on the website is **staff-only** (`/admin/support`). Buyers link the order in Telegram:
  - Open the bot link from the order page (`?start=order_<uuid>` opens chat immediately), or
  - Send the order number as a message, or `/link ABCD-EFGH`.
- Optional: `/email` with checkout email if the number is tied to another inbox.

`SITE_URL` / `BETTER_AUTH_URL` must be the public HTTPS origin used for webhooks and payment return URLs.

## Local development

1. Create a bot in [@BotFather](https://t.me/BotFather).
2. Add the token and your Telegram user ID to `.env`.
3. Run long polling (no HTTPS):

```bash
pnpm telegram:poll
```

## Production webhooks

In production, the app registers the Telegram webhook automatically on server startup when `SITE_URL` is HTTPS and `TELEGRAM_SELL_BOT_TOKEN` is set. Restarting the service after deploy is enough.

You can still register manually:

On the VPS, run from `/opt/ai-sub-sell/app`. Scripts load env from `../shared/.env` automatically (same as systemd). You can also set `ENV_FILE=/path/to/.env`.

```bash
cd /opt/ai-sub-sell/app
pnpm telegram:check
pnpm telegram:webhooks
```

This registers:

- `{SITE_URL}/api/telegram/sell/webhook`

Set `TELEGRAM_AUTO_WEBHOOKS=false` to disable startup registration, or `TELEGRAM_AUTO_WEBHOOKS=true` to enable it outside production (for example with an HTTPS tunnel).

If `TELEGRAM_WEBHOOK_SECRET` is set, the same value is sent to Telegram and must match the `X-Telegram-Bot-Api-Secret-Token` header. Telegram allows only `A-Z`, `a-z`, `0-9`, `_`, and `-` (1–256 chars). Generate one with:

```bash
openssl rand -hex 32
```

## Troubleshooting webhooks

### `Request timed out after 10000 ms` or `Connection timed out` in journalctl / `telegram:check`

Telegram must get HTTP **200 quickly**. Handlers that await DB, SMTP, or `ctx.reply` (outbound Bot API) used to block the webhook response; Telegram then reports `Connection timed out` or `500`.

Webhook routes return **200 immediately** (with `Connection: close`) and process updates in a detached async task. Each update calls `bot.init()` before `handleUpdate`. Webhooks use `max_connections=1` so Telegram does not overload a small VPS. After deploying, restart and re-check:

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

### `pending updates` keeps growing / `Connection timed out` after deploy

Telegram retries failed deliveries. A minimal curl body (`{"update_id":1}`) returns 200 immediately, but **real** queued updates can still time out (for example during restart, or when handlers are slow).

Clear the backlog and cap parallel deliveries:

```bash
pnpm telegram:webhooks   # force setWebhook + drop_pending_updates + max_connections=1
```

Then send a fresh `/start` to the bot and run `pnpm telegram:check` again.

### `Connect Timeout Error` to `api.telegram.org` (IPv6 then IPv4)

If logs show `attempted addresses: 2001:67c:4e8:...:443, 149.154.x.x:443, timeout: 10000ms`, the VPS cannot reach Telegram’s API outbound. Node tries IPv6 first; many VPS hosts have broken IPv6.

On the VPS, compare:

```bash
source /opt/ai-sub-sell/shared/.env
curl -4 -m 15 "https://api.telegram.org/bot${TELEGRAM_SELL_BOT_TOKEN}/getMe"
curl -6 -m 5 "https://api.telegram.org/bot${TELEGRAM_SELL_BOT_TOKEN}/getMe"
```

If `-4` works but `-6` hangs, force IPv4 for Node (systemd + CLI scripts):

```bash
# One-time: merge NODE_OPTIONS into /etc/systemd/system/ai-sub-sell.service, then:
sudo systemctl daemon-reload
sudo systemctl restart ai-sub-sell

# Ad-hoc scripts:
NODE_OPTIONS='--dns-result-order=ipv4first' pnpm telegram:check
```

Production systemd sets `NODE_OPTIONS=--dns-result-order=ipv4first` by default. If **both** curl variants fail, the host or firewall blocks Telegram — use another network or a proxy; webhooks inbound can still work while Bot API calls fail.

If `getMe` succeeds but the next API call times out, the route is flaky (parallel bursts or provider filtering). The app retries Telegram HTTP calls (30s timeout, 3 attempts). Run checks sequentially:

```bash
NODE_OPTIONS='--dns-result-order=ipv4first' pnpm telegram:check
```

### `Connection timed out` right after restart

Expected if `telegram:check` runs while the service is still starting. Wait a few seconds after `systemctl restart` before checking.

## Notes

- Orders created in Telegram store `buyerTelegramUserId` for notifications.
- Web checkout is unchanged; Telegram uses the same `createCheckoutOrder` and order chat tables.
- YooKassa webhook still drives payment status; the bot is notified after `payment.succeeded`.
- Remove the old support-bot webhook in BotFather if you previously used a second bot: delete that bot or call `deleteWebhook` on its token so Telegram stops sending to `/api/telegram/support/webhook`.
