import type { Context } from "grammy";
import { Bot, InlineKeyboard } from "grammy";
import { getSupportOrders } from "@/lib/support/queries";
import { SITE_NAME } from "@/lib/brand";
import { upsertTelegramAccount } from "@/lib/telegram/accounts";
import { getSupportBotToken } from "@/lib/telegram/config";
import { telegramBotClientConfig } from "@/lib/telegram/telegram-fetch";
import { isSupportTelegramUser } from "@/lib/telegram/support-access";
import { escapeHtml, formatOrderSummary, truncate } from "@/lib/telegram/format";
import { supportOrderActionsKeyboard, supportOrderListKeyboard, supportGeneralChatActionsKeyboard, supportGeneralChatListKeyboard } from "@/lib/telegram/keyboards";
import {
  getOrderChatMessages,
  postSellerMessage,
  updateOrderFulfillment,
} from "@/lib/telegram/orders";
import {
  getBuyerGeneralChatMessages,
  postSellerGeneralMessage,
} from "@/lib/telegram/conversations";
import { getSupportConversations, getSupportConversation } from "@/lib/support/conversations";
import db from "@/lib/db";
import {
  clearSessionState,
  getSessionState,
  setSessionState,
  type SupportBotState,
} from "@/lib/telegram/session";
import { orderWebUrl, supportConversationWebUrl, supportOrderWebUrl } from "@/lib/telegram/notify";
import { catchBotErrors } from "@/lib/telegram/bots/catch";

const PAGE_SIZE = 8;

const SUPPORT_DENIED_MESSAGE = [
  "У вас нет доступа к боту поддержки.",
  "",
  "1. Получите Telegram ID через @userinfobot",
  "2. Привяжите ID в админ-панели: раздел «Telegram»",
  "3. Отправьте /start этому боту снова",
].join("\n");

async function requireSupport(ctx: Context): Promise<boolean> {
  if (!ctx.from) return false;
  return isSupportTelegramUser(ctx.from.id);
}

export function createSupportBot(): Bot {
  const token = getSupportBotToken();
  if (!token) {
    throw new Error("TELEGRAM_SUPPORT_BOT_TOKEN is not configured");
  }

  const bot = new Bot(token, telegramBotClientConfig);

  catchBotErrors(bot, "support");

  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await upsertTelegramAccount(ctx.from, ctx.chat?.id ?? ctx.from.id);
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.reply(SUPPORT_DENIED_MESSAGE);
      return;
    }
    await clearSessionState(String(ctx.from!.id), "support");
    await ctx.reply(
      [
        `🛟 <b>${SITE_NAME} — поддержка</b>`,
        "",
        "/orders — список заказов",
        "/chats — обращения без заказа",
        "/order_<code>uuid</code> — открыть заказ",
        "/chat_<code>uuid</code> — открыть обращение",
        "/help — справка",
        "",
        "В заказе можно ответить покупателю и выдать доступ.",
      ].join("\n"),
      { parse_mode: "HTML" },
    );
  });

  bot.command("orders", async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.reply(SUPPORT_DENIED_MESSAGE);
      return;
    }
    await showSupportOrders(ctx, 0);
  });

  bot.command("chats", async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.reply(SUPPORT_DENIED_MESSAGE);
      return;
    }
    await showSupportGeneralChats(ctx, 0);
  });

  bot.command("help", async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.reply(SUPPORT_DENIED_MESSAGE);
      return;
    }
    await ctx.reply(
      [
        "<b>Команды</b>",
        "/orders — список заказов с непрочитанными сообщениями",
        "/chats — обращения без заказа",
        "/order_<code>uuid</code> — открыть заказ по ID",
        "/chat_<code>uuid</code> — открыть обращение по ID",
        "",
        "В карточке заказа можно ответить покупателю или выдать доступ.",
      ].join("\n"),
      { parse_mode: "HTML" },
    );
  });

  bot.hears(/^\/order_(.+)$/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.reply(SUPPORT_DENIED_MESSAGE);
      return;
    }
    const orderId = ctx.match![1]!.trim();
    await showSupportOrder(ctx, orderId);
  });

  bot.hears(/^\/chat_(.+)$/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.reply(SUPPORT_DENIED_MESSAGE);
      return;
    }
    const conversationId = ctx.match![1]!.trim();
    await showSupportGeneralChat(ctx, conversationId);
  });

  bot.callbackQuery(/^sop:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const page = Number(ctx.callbackQuery.data.slice(4)) || 0;
    await showSupportOrders(ctx, page, true);
  });

  bot.callbackQuery(/^so:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const orderId = ctx.callbackQuery.data.slice(3);
    await showSupportOrder(ctx, orderId, true);
  });

  bot.callbackQuery(/^sc:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const orderId = ctx.callbackQuery.data.slice(3);
    await setSessionState<SupportBotState>(String(ctx.from!.id), "support", {
      step: "order_chat",
      orderId,
    });
    const messages = await getOrderChatMessages(orderId);
    const preview =
      messages.length === 0
        ? "Сообщений нет."
        : messages
            .slice(-8)
            .map((m) => `${m.author === "seller" ? "🛟" : "👤"} ${truncate(m.body, 300)}`)
            .join("\n\n");
    await ctx.reply(
      `💬 Чат заказа <code>${orderId}</code>\n\n${escapeHtml(preview)}\n\nНапишите ответ:`,
      { parse_mode: "HTML" },
    );
  });

  bot.callbackQuery(/^sf:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const orderId = ctx.callbackQuery.data.slice(3);
    await setSessionState<SupportBotState>(String(ctx.from!.id), "support", {
      step: "awaiting_fulfillment",
      orderId,
    });
    await ctx.reply(
      `📦 Отправьте данные доступа для заказа <code>${orderId}</code> одним сообщением:`,
      { parse_mode: "HTML" },
    );
  });

  bot.callbackQuery(/^sgcl:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const page = Number(ctx.callbackQuery.data.slice(5)) || 0;
    await showSupportGeneralChats(ctx, page, true);
  });

  bot.callbackQuery(/^sgc:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const conversationId = ctx.callbackQuery.data.slice(4);
    await showSupportGeneralChat(ctx, conversationId, true);
  });

  bot.callbackQuery(/^sgcc:/, async (ctx) => {
    if (!(await requireSupport(ctx))) {
      await ctx.answerCallbackQuery({ text: "Доступ запрещён" });
      return;
    }
    await ctx.answerCallbackQuery();
    const conversationId = ctx.callbackQuery.data.slice(5);
    await setSessionState<SupportBotState>(String(ctx.from!.id), "support", {
      step: "general_chat",
      conversationId,
    });
    const messages = await getBuyerGeneralChatMessages(conversationId);
    const preview =
      messages.length === 0
        ? "Сообщений нет."
        : messages
            .slice(-8)
            .map((m) => `${m.author === "seller" ? "🛟" : "👤"} ${truncate(m.body, 300)}`)
            .join("\n\n");
    await ctx.reply(
      `💬 Обращение <code>${conversationId}</code>\n\n${escapeHtml(preview)}\n\nНапишите ответ:`,
      { parse_mode: "HTML" },
    );
  });

  bot.on("message:text", async (ctx) => {
    if (!(await requireSupport(ctx))) return;

    const telegramUserId = String(ctx.from!.id);
    const state = await getSessionState<SupportBotState>(telegramUserId, "support");

    if (state.step === "general_chat" && state.conversationId) {
      const result = await postSellerGeneralMessage(state.conversationId, ctx.message.text);
      if (!result.ok) {
        await ctx.reply(result.error);
        return;
      }
      await ctx.reply("✅ Ответ отправлен покупателю.");
      return;
    }

    if (state.step === "order_chat" && state.orderId) {
      const result = await postSellerMessage(state.orderId, ctx.message.text);
      if (!result.ok) {
        await ctx.reply(result.error);
        return;
      }
      await ctx.reply("✅ Ответ отправлен покупателю.");
      return;
    }

    if (state.step === "awaiting_fulfillment" && state.orderId) {
      const result = await updateOrderFulfillment(state.orderId, ctx.message.text);
      if (!result.ok) {
        await ctx.reply(result.error);
        return;
      }
      await clearSessionState(telegramUserId, "support");
      await ctx.reply("✅ Доступ выдан. Покупатель получит уведомление в Telegram.");
      return;
    }
  });

  return bot;
}

async function showSupportOrders(ctx: Context, page: number, edit = false) {
  const all = await getSupportOrders();
  const start = page * PAGE_SIZE;
  const slice = all.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < all.length;

  const text = [
    `📋 <b>Заказы</b> (${all.length})`,
    page > 0 ? `Страница ${page + 1}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const markup = new InlineKeyboard(
    supportOrderListKeyboard(
      slice.map((o) => ({
        id: o.id,
        planName: o.planName,
        unreadCount: o.unreadCount,
      })),
      page,
      hasMore,
    ),
  );

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: markup });
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: markup });
  }
}

async function showSupportOrder(ctx: Context, orderId: string, edit = false) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerEmail: true,
      productContent: true,
      buyerTelegramUserId: true,
      confirmationUrl: true,
    },
  });

  if (!order) {
    const msg = "Заказ не найден.";
    if (edit) await ctx.editMessageText(msg);
    else await ctx.reply(msg);
    return;
  }

  const lines = [formatOrderSummary(order)];
  if (order.buyerTelegramUserId) {
    lines.push("", "📱 Заказ из Telegram");
  }
  if (order.productContent) {
    lines.push("", "<b>Доступ:</b>", escapeHtml(truncate(order.productContent, 1500)));
  }
  if (order.status === "PENDING" && order.confirmationUrl) {
    lines.push("", `Оплата: ${order.confirmationUrl}`);
  }
  lines.push("", `🛟 ${supportOrderWebUrl(order.id)}`);
  lines.push(`👤 ${orderWebUrl(order.id)}`);

  const markup = new InlineKeyboard(supportOrderActionsKeyboard(orderId));

  if (edit && ctx.callbackQuery) {
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

async function showSupportGeneralChats(ctx: Context, page: number, edit = false) {
  const all = await getSupportConversations();
  const start = page * PAGE_SIZE;
  const slice = all.slice(start, start + PAGE_SIZE);
  const hasMore = start + PAGE_SIZE < all.length;

  const text = [
    `💬 <b>Обращения</b> (${all.length})`,
    page > 0 ? `Страница ${page + 1}` : "",
    "",
    "Чаты без привязки к заказу.",
  ]
    .filter(Boolean)
    .join("\n");

  const markup = new InlineKeyboard(
    supportGeneralChatListKeyboard(
      slice.map((conversation) => ({
        id: conversation.id,
        buyerLabel: conversation.buyerLabel,
        unreadCount: conversation.unreadCount,
      })),
      page,
      hasMore,
    ),
  );

  if (edit && ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: markup });
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: markup });
  }
}

async function showSupportGeneralChat(
  ctx: Context,
  conversationId: string,
  edit = false,
) {
  const conversation = await getSupportConversation(conversationId);

  if (!conversation || conversation.status !== "OPEN") {
    const msg = "Обращение не найдено.";
    if (edit) await ctx.editMessageText(msg);
    else await ctx.reply(msg);
    return;
  }

  const buyerLabel =
    conversation.buyerTelegram?.firstName ||
    conversation.buyerTelegram?.username ||
    conversation.user?.name ||
    conversation.buyerEmail ||
    conversation.buyerTelegram?.email ||
    "Telegram";

  const lines = [
    `💬 <b>Обращение</b>`,
    `ID: <code>${conversation.id}</code>`,
    `Клиент: ${escapeHtml(buyerLabel)}`,
  ];

  if (conversation.buyerEmail || conversation.buyerTelegram?.email) {
    lines.push(`Email: ${escapeHtml(conversation.buyerEmail ?? conversation.buyerTelegram?.email ?? "")}`);
  }

  if (conversation.buyerTelegramUserId) {
    lines.push("", "📱 Telegram-покупатель");
  }

  lines.push("", `🛟 ${supportConversationWebUrl(conversation.id)}`);

  const markup = new InlineKeyboard(supportGeneralChatActionsKeyboard(conversationId));

  if (edit && ctx.callbackQuery) {
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
