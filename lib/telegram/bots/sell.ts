import type { Context } from "grammy";
import { Bot, InlineKeyboard } from "grammy";
import { getPlans } from "@/lib/plans";
import { formatPrice } from "@/lib/plans/format";
import { groupPlansByProvider } from "@/lib/plans/grouping";
import { SITE_NAME } from "@/lib/brand";
import { upsertTelegramAccount, resolveBuyerEmailForTelegram } from "@/lib/telegram/accounts";
import { getSellBotToken } from "@/lib/telegram/config";
import { escapeHtml, formatOrderSummary, truncate } from "@/lib/telegram/format";
import {
  CB,
  orderActionsKeyboard,
  orderListKeyboard,
  planKeyboard,
  providerKeyboard,
  tierKeyboard,
} from "@/lib/telegram/keyboards";
import {
  createTelegramCheckout,
  getBuyerTelegramOrder,
  getOrderChatMessages,
  listBuyerTelegramOrders,
  postBuyerMessage,
} from "@/lib/telegram/orders";
import {
  clearSessionState,
  getSessionState,
  setSessionState,
  type SellBotState,
} from "@/lib/telegram/session";
import { orderWebUrl } from "@/lib/telegram/notify";

export function createSellBot(): Bot {
  const token = getSellBotToken();
  if (!token) {
    throw new Error("TELEGRAM_SELL_BOT_TOKEN is not configured");
  }

  const bot = new Bot(token);

  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await upsertTelegramAccount(ctx.from, ctx.chat?.id ?? ctx.from.id);
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    await clearSessionState(String(ctx.from!.id), "sell");
    await ctx.reply(
      [
        `👋 <b>${SITE_NAME}</b> — подписки Codex, Cursor, Claude`,
        "",
        "Выберите тариф, укажите email и оплатите через ЮKassa. Заказ и чат с поддержкой — прямо в боте.",
        "",
        "/catalog — каталог",
        "/orders — мои заказы",
        "/email — привязать email",
        "/help — справка",
      ].join("\n"),
      { parse_mode: "HTML" },
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "<b>Команды</b>",
        "/catalog — выбрать тариф и оплатить",
        "/orders — список заказов",
        "/email your@mail.com — сохранить email для оплаты",
        "",
        "После оплаты доступ появится в заказе. Вопросы — в чате заказа.",
      ].join("\n"),
      { parse_mode: "HTML" },
    );
  });

  bot.command("email", async (ctx) => {
    const text = ctx.message?.text ?? "";
    const email = text.replace(/^\/email\s*/i, "").trim();
    if (!email) {
      await ctx.reply("Укажите email: /email your@mail.com");
      return;
    }
    const { setTelegramAccountEmail } = await import("@/lib/telegram/accounts");
    const result = await setTelegramAccountEmail(String(ctx.from!.id), email);
    if (!result.ok) {
      await ctx.reply(result.error);
      return;
    }
    await ctx.reply(`✅ Email сохранён: ${email}`);
  });

  bot.command("catalog", async (ctx) => {
    await showCatalog(ctx);
  });

  bot.command("orders", async (ctx) => {
    await showOrders(ctx);
  });

  bot.callbackQuery(CB.backProviders(), async (ctx) => {
    await ctx.answerCallbackQuery();
    await showCatalog(ctx);
  });

  bot.callbackQuery(CB.backCatalog(), async (ctx) => {
    await ctx.answerCallbackQuery();
    await showCatalog(ctx);
  });

  bot.callbackQuery(/^sp:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const providerId = ctx.callbackQuery.data.slice(3);
    const plans = await getPlans();
    const group = groupPlansByProvider(plans).find((g) => g.id === providerId);
    if (!group) {
      await ctx.editMessageText("Тарифы не найдены.");
      return;
    }
    await ctx.editMessageText(`<b>${escapeHtml(group.label)}</b>\n\nВыберите уровень:`, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard(tierKeyboard(providerId, group.tiers.map((t) => ({ id: t.id, label: t.label })))),
    });
  });

  bot.callbackQuery(/^st:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const [, providerId, tierId] = ctx.callbackQuery.data.split(":");
    const plans = await getPlans();
    const group = groupPlansByProvider(plans).find((g) => g.id === providerId);
    const tier = group?.tiers.find((t) => t.id === tierId);
    if (!tier) {
      await ctx.editMessageText("Тарифы не найдены.");
      return;
    }
    await ctx.editMessageText(
      `<b>${escapeHtml(tier.label)}</b>\n\nВыберите срок:`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard(planKeyboard(tier.options)),
      },
    );
  });

  bot.callbackQuery(/^pl:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const planId = ctx.callbackQuery.data.slice(3);
    const plans = await getPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      await ctx.editMessageText("Тариф недоступен.");
      return;
    }

    const telegramUserId = String(ctx.from!.id);
    const email = await resolveBuyerEmailForTelegram(telegramUserId);

    if (!email) {
      await setSessionState<SellBotState>(telegramUserId, "sell", {
        step: "awaiting_email",
        planId,
      });
      await ctx.editMessageText(
        [
          `<b>${escapeHtml(plan.name)}</b>`,
          `Цена: ${formatPrice(plan.price, plan.currency)}`,
          "",
          "Введите email для чека и доступа к заказу:",
          "или сначала: /email your@mail.com",
        ].join("\n"),
        { parse_mode: "HTML" },
      );
      return;
    }

    await startCheckout(ctx, telegramUserId, planId, email, plan.name, plan.price, plan.currency);
  });

  bot.callbackQuery(CB.orders(), async (ctx) => {
    await ctx.answerCallbackQuery();
    await showOrders(ctx, true);
  });

  bot.callbackQuery(/^or:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = ctx.callbackQuery.data.slice(3);
    await showOrderDetail(ctx, orderId, true);
  });

  bot.callbackQuery(/^pay:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = ctx.callbackQuery.data.slice(4);
    const order = await getBuyerTelegramOrder(String(ctx.from!.id), orderId);
    if (!order?.confirmationUrl) {
      await ctx.reply("Ссылка на оплату недоступна.");
      return;
    }
    await ctx.reply(`Оплатите заказ:\n${order.confirmationUrl}`);
  });

  bot.callbackQuery(/^ch:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = ctx.callbackQuery.data.slice(3);
    await setSessionState<SellBotState>(String(ctx.from!.id), "sell", {
      step: "order_chat",
      orderId,
    });
    const messages = await getOrderChatMessages(orderId);
    const preview =
      messages.length === 0
        ? "Сообщений пока нет. Напишите текст ответом на это сообщение."
        : messages
            .slice(-5)
            .map((m) => `${m.author === "seller" ? "🛟" : "👤"} ${truncate(m.body, 200)}`)
            .join("\n\n");
    await ctx.reply(
      `💬 Чат заказа <code>${orderId}</code>\n\n${escapeHtml(preview)}\n\nНапишите сообщение:`,
      { parse_mode: "HTML" },
    );
  });

  bot.on("message:text", async (ctx) => {
    const telegramUserId = String(ctx.from!.id);
    const state = await getSessionState<SellBotState>(telegramUserId, "sell");

    if (state.step === "awaiting_email" && state.planId) {
      const email = ctx.message.text.trim();
      const { setTelegramAccountEmail } = await import("@/lib/telegram/accounts");
      const linked = await setTelegramAccountEmail(telegramUserId, email);
      if (!linked.ok) {
        await ctx.reply(linked.error);
        return;
      }
      await clearSessionState(telegramUserId, "sell");
      const plans = await getPlans();
      const plan = plans.find((p) => p.id === state.planId);
      if (!plan) {
        await ctx.reply("Тариф больше недоступен. /catalog");
        return;
      }
      await startCheckout(
        ctx,
        telegramUserId,
        state.planId,
        email,
        plan.name,
        plan.price,
        plan.currency,
      );
      return;
    }

    if (state.step === "order_chat" && state.orderId) {
      const result = await postBuyerMessage(state.orderId, telegramUserId, ctx.message.text);
      if (!result.ok) {
        await ctx.reply(result.error);
        return;
      }
      await ctx.reply("✅ Сообщение отправлено. Ответ придёт сюда и в /orders");
      return;
    }
  });

  return bot;
}

async function showCatalog(ctx: Context, edit = false) {
  const plans = await getPlans();
  const groups = groupPlansByProvider(plans);
  const text = "📋 <b>Каталог тарифов</b>\n\nВыберите сервис:";
  const markup = new InlineKeyboard(providerKeyboard(groups));

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: markup });
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: markup });
  }
}

async function showOrders(ctx: Context, edit = false) {
  const orders = await listBuyerTelegramOrders(String(ctx.from!.id));
  if (orders.length === 0) {
    const text = "У вас пока нет заказов. Выберите тариф: /catalog";
    if (edit && ctx.callbackQuery) {
      await ctx.editMessageText(text);
    } else {
      await ctx.reply(text);
    }
    return;
  }

  const text = "📦 <b>Ваши заказы</b>";
  const markup = new InlineKeyboard(orderListKeyboard(orders));

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: markup });
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: markup });
  }
}

async function showOrderDetail(ctx: Context, orderId: string, edit: boolean) {
  const order = await getBuyerTelegramOrder(String(ctx.from!.id), orderId);
  if (!order) {
    await ctx.editMessageText("Заказ не найден.");
    return;
  }

  const lines = [formatOrderSummary(order)];
  if (order.productContent) {
    lines.push("", "<b>Доступ:</b>", escapeHtml(order.productContent));
  }
  lines.push("", `🌐 ${orderWebUrl(order.id)}`);

  const markup = new InlineKeyboard(orderActionsKeyboard(order));

  if (edit) {
    await ctx.editMessageText(lines.join("\n"), {
      parse_mode: "HTML",
      reply_markup: markup,
      link_preview_options: { is_disabled: true },
    });
  } else {
    await ctx.reply(lines.join("\n"), {
      parse_mode: "HTML",
      reply_markup: markup,
      link_preview_options: { is_disabled: true },
    });
  }
}

async function startCheckout(
  ctx: Context,
  telegramUserId: string,
  planId: string,
  email: string,
  planName: string,
  price: number,
  currency: string,
) {
  const result = await createTelegramCheckout({ telegramUserId, planId, email });

  if (!result.ok) {
    const msg = `❌ ${result.error}`;
    if (ctx.callbackQuery) {
      await ctx.editMessageText(msg);
    } else {
      await ctx.reply(msg);
    }
    return;
  }

  const text = [
    "✅ <b>Заказ создан</b>",
    "",
    escapeHtml(planName),
    formatPrice(price, currency),
    "",
    "Нажмите «Оплатить» или откройте ссылку:",
    result.confirmationUrl,
    "",
    `После оплаты: /orders`,
  ].join("\n");

  const markup = new InlineKeyboard([
    [{ text: "💳 Оплатить", url: result.confirmationUrl }],
    [{ text: "📦 Открыть заказ", callback_data: CB.order(result.orderId) }],
  ]);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: markup,
      link_preview_options: { is_disabled: false },
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: markup,
      link_preview_options: { is_disabled: false },
    });
  }
}
