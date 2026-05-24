# Telegram bots

Two bots mirror the website: **sell** (buyers) and **support** (staff).

## Sell bot

- Browse catalog (Codex / Cursor / Claude, tiers, durations)
- Checkout via YooKassa (same flow as the site)
- List orders, pay pending orders, chat with support
- Notifications on payment, support replies, and fulfillment

Commands: `/start`, `/catalog`, `/orders`, `/email your@mail.com`, `/help`

## Support bot

- Order list with unread indicators (same data as `/support` on the web)
- Open order, reply in chat, paste fulfillment credentials
- Notifications for new Telegram orders and buyer messages

Access is limited to numeric Telegram user IDs in `TELEGRAM_SUPPORT_USER_IDS`. Staff must send `/start` to the support bot once so their `chat_id` is stored.

Commands: `/start`, `/orders`, `/order_<uuid>`

## Environment

```env
TELEGRAM_SELL_BOT_TOKEN=...
TELEGRAM_SUPPORT_BOT_TOKEN=...
TELEGRAM_SUPPORT_USER_IDS=123456789,987654321
TELEGRAM_WEBHOOK_SECRET=random-secret
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

After deploy, with the app reachable over HTTPS:

```bash
pnpm telegram:webhooks
```

This registers:

- `{SITE_URL}/api/telegram/sell/webhook`
- `{SITE_URL}/api/telegram/support/webhook`

If `TELEGRAM_WEBHOOK_SECRET` is set, the same value is sent to Telegram and must match the `X-Telegram-Bot-Api-Secret-Token` header.

## Notes

- Orders created in Telegram store `buyerTelegramUserId` for notifications.
- Web checkout is unchanged; Telegram uses the same `createCheckoutOrder` and order chat tables.
- YooKassa webhook still drives payment status; the sell bot is notified after `payment.succeeded`.
