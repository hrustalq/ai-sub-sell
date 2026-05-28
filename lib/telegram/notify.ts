import "server-only";

import db from "@/lib/db";
import { SITE_NAME } from "@/lib/brand";
import { formatPrice } from "@/lib/plans/format";
import { absoluteUrl } from "@/lib/site-url";
import { routes } from "@/lib/routes";
import { sendTelegramMessage } from "@/lib/telegram/api";
import {
  getSellBotToken,
  getSupportBotToken,
} from "@/lib/telegram/config";
import { getSupportStaffChatIds } from "@/lib/telegram/support-access";
import { escapeHtml, formatOrderStatus, truncate } from "@/lib/telegram/format";

export async function notifyBuyerOrderPaid(orderId: string): Promise<void> {
  const token = getSellBotToken();
  if (!token) return;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      status: true,
      buyerTelegramUserId: true,
      productContent: true,
    },
  });

  if (!order?.buyerTelegramUserId || order.status !== "PAID") return;

  const account = await db.telegramAccount.findUnique({
    where: { telegramUserId: order.buyerTelegramUserId },
    select: { chatId: true },
  });
  if (!account) return;

  const lines = [
    `✅ <b>Оплата получена</b>`,
    "",
    `Тариф: ${escapeHtml(order.planName)}`,
    `Сумма: ${formatPrice(order.amount, order.currency)}`,
    "",
    "Мы подготовим доступ и пришлём его в чат заказа. Откройте заказ в боте: /orders",
  ];

  if (order.productContent) {
    lines.push("", "<b>Данные доступа:</b>", escapeHtml(order.productContent));
  }

  await sendTelegramMessage(token, account.chatId, lines.join("\n"), {
    parseMode: "HTML",
  });
}

export async function notifyBuyerFulfillmentUpdated(orderId: string): Promise<void> {
  const token = getSellBotToken();
  if (!token) return;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      planName: true,
      buyerTelegramUserId: true,
      productContent: true,
    },
  });

  if (!order?.buyerTelegramUserId || !order.productContent) return;

  const account = await db.telegramAccount.findUnique({
    where: { telegramUserId: order.buyerTelegramUserId },
    select: { chatId: true },
  });
  if (!account) return;

  await sendTelegramMessage(
    token,
    account.chatId,
    [
      `📬 <b>Доступ готов</b>`,
      "",
      `Тариф: ${escapeHtml(order.planName)}`,
      "",
      escapeHtml(order.productContent),
      "",
      "Открыть заказ: /orders",
    ].join("\n"),
    { parseMode: "HTML" },
  );
}

export async function notifyBuyerNewSellerMessage(params: {
  orderId: string;
  planName: string;
  body: string;
}): Promise<void> {
  const token = getSellBotToken();
  if (!token) return;

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    select: { buyerTelegramUserId: true },
  });
  if (!order?.buyerTelegramUserId) return;

  const account = await db.telegramAccount.findUnique({
    where: { telegramUserId: order.buyerTelegramUserId },
    select: { chatId: true },
  });
  if (!account) return;

  await sendTelegramMessage(
    token,
    account.chatId,
    [
      `🛟 <b>Ответ поддержки</b>`,
      `Заказ: ${escapeHtml(params.planName)}`,
      "",
      truncate(escapeHtml(params.body), 3500),
      "",
      "Открыть: /orders",
    ].join("\n"),
    { parseMode: "HTML" },
  );
}

export async function notifySupportOfBuyerMessage(params: {
  orderId: string;
  planName: string;
  body: string;
}): Promise<void> {
  const token = getSupportBotToken();
  if (!token) return;

  const chatIds = await getSupportStaffChatIds();
  if (chatIds.length === 0) return;

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    select: { buyerEmail: true, status: true },
  });

  const text = [
    `💬 <b>Новое сообщение от покупателя</b>`,
    "",
    `Заказ: <code>${params.orderId}</code>`,
    `Тариф: ${escapeHtml(params.planName)}`,
    order ? `Email: ${escapeHtml(order.buyerEmail)}` : "",
    order ? `Статус: ${formatOrderStatus(order.status)}` : "",
    "",
    truncate(escapeHtml(params.body), 500),
    "",
    `Ответить: /order_${params.orderId}`,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all(
    chatIds.map((chatId) =>
      sendTelegramMessage(token, chatId, text, { parseMode: "HTML" }),
    ),
  );
}

export async function notifySupportNewTelegramOrder(orderId: string): Promise<void> {
  const token = getSupportBotToken();
  if (!token) return;

  const chatIds = await getSupportStaffChatIds();
  if (chatIds.length === 0) return;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      buyerEmail: true,
      status: true,
    },
  });
  if (!order) return;

  const text = [
    `🛒 <b>Новый заказ из Telegram</b>`,
    "",
    `Тариф: ${escapeHtml(order.planName)}`,
    `Сумма: ${formatPrice(order.amount, order.currency)}`,
    `Email: ${escapeHtml(order.buyerEmail)}`,
    `Статус: ${formatOrderStatus(order.status)}`,
    `ID: <code>${order.id}</code>`,
    "",
    `/order_${order.id}`,
  ].join("\n");

  await Promise.all(
    chatIds.map((chatId) =>
      sendTelegramMessage(token, chatId, text, { parseMode: "HTML" }),
    ),
  );
}

export async function sendSellBotWelcome(chatId: string | number): Promise<void> {
  const token = getSellBotToken();
  if (!token) return;

  await sendTelegramMessage(
    token,
    chatId,
    [
      `Добро пожаловать в <b>${SITE_NAME}</b>!`,
      "",
      "Здесь можно выбрать тариф Codex, Cursor или Claude и оплатить через ЮKassa.",
      "",
      "/catalog — каталог тарифов",
      "/orders — ваши заказы",
      "/support — чат с поддержкой (без заказа)",
      "/email — привязать email (код придёт на почту)",
      "/help — справка",
    ].join("\n"),
    { parseMode: "HTML" },
  );
}

export function orderWebUrl(orderId: string): string {
  return absoluteUrl(routes.order(orderId));
}

export function supportOrderWebUrl(orderId: string): string {
  return absoluteUrl(routes.admin.supportOrder(orderId));
}

export function supportConversationWebUrl(conversationId: string): string {
  return absoluteUrl(routes.admin.supportConversation(conversationId));
}

export async function notifySupportOfGeneralBuyerMessage(params: {
  conversationId: string;
  buyerEmail: string | null;
  body: string;
}): Promise<void> {
  const token = getSupportBotToken();
  if (!token) return;

  const chatIds = await getSupportStaffChatIds();
  if (chatIds.length === 0) return;

  const text = [
    `💬 <b>Новое обращение</b>`,
    "",
    `Чат: <code>${params.conversationId}</code>`,
    params.buyerEmail ? `Email: ${escapeHtml(params.buyerEmail)}` : "Telegram-покупатель",
    "",
    truncate(escapeHtml(params.body), 500),
    "",
    `Ответить: /chat_${params.conversationId}`,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all(
    chatIds.map((chatId) =>
      sendTelegramMessage(token, chatId, text, { parseMode: "HTML" }),
    ),
  );
}

export async function notifyBuyerNewGeneralSellerMessage(params: {
  conversationId: string;
  body: string;
}): Promise<void> {
  const token = getSellBotToken();
  if (!token) return;

  const conversation = await db.supportConversation.findUnique({
    where: { id: params.conversationId },
    select: { buyerTelegramUserId: true },
  });

  if (!conversation?.buyerTelegramUserId) return;

  const account = await db.telegramAccount.findUnique({
    where: { telegramUserId: conversation.buyerTelegramUserId },
    select: { chatId: true },
  });
  if (!account) return;

  await sendTelegramMessage(
    token,
    account.chatId,
    [
      `🛟 <b>Ответ поддержки</b>`,
      "",
      truncate(escapeHtml(params.body), 3500),
      "",
      "Продолжить: /support",
    ].join("\n"),
    { parseMode: "HTML" },
  );
}
