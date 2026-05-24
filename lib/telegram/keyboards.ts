import type { InlineKeyboardButton } from "grammy/types";
import type { Plan } from "@/lib/plans/types";
import { formatPrice } from "@/lib/plans/format";
import { getDiscountPercent, groupPlansByProvider } from "@/lib/plans/grouping";

const CB = {
  provider: (id: string) => `sp:${id}`,
  tier: (provider: string, tier: string) => `st:${provider}:${tier}`,
  plan: (id: string) => `pl:${id}`,
  orders: () => "orders",
  order: (id: string) => `or:${id}`,
  pay: (id: string) => `pay:${id}`,
  chat: (id: string) => `ch:${id}`,
  backCatalog: () => "cat",
  backProviders: () => "prov",
  supportOrder: (id: string) => `so:${id}`,
  supportOrders: (page: number) => `sop:${page}`,
  supportChat: (id: string) => `sc:${id}`,
  supportFulfill: (id: string) => `sf:${id}`,
} as const;

export { CB };

export function providerKeyboard(
  groups: ReturnType<typeof groupPlansByProvider>,
): InlineKeyboardButton[][] {
  return groups.map((g) => [
    { text: g.label, callback_data: CB.provider(g.id) },
  ]);
}

export function tierKeyboard(
  providerId: string,
  tiers: { id: string; label: string }[],
): InlineKeyboardButton[][] {
  const rows = tiers.map((t) => [
    { text: t.label, callback_data: CB.tier(providerId, t.id) },
  ]);
  rows.push([{ text: "← Назад", callback_data: CB.backProviders() }]);
  return rows;
}

export function planKeyboard(plans: Plan[]): InlineKeyboardButton[][] {
  const rows = plans.map((plan) => {
    const discount = getDiscountPercent(plan);
    const suffix = discount ? ` (−${discount}%)` : "";
    return [
      {
        text: `${plan.period} — ${formatPrice(plan.price, plan.currency)}${suffix}`,
        callback_data: CB.plan(plan.id),
      },
    ];
  });
  rows.push([{ text: "← Назад", callback_data: CB.backCatalog() }]);
  return rows;
}

export function orderListKeyboard(
  orders: { id: string; planName: string; status: string }[],
): InlineKeyboardButton[][] {
  const rows = orders.slice(0, 10).map((o) => [
    {
      text: `${o.planName} (${o.status})`,
      callback_data: CB.order(o.id),
    },
  ]);
  return rows;
}

export function orderActionsKeyboard(order: {
  id: string;
  status: string;
  confirmationUrl: string | null;
}): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = [];

  if (order.status === "PENDING" && order.confirmationUrl) {
    rows.push([{ text: "💳 Оплатить", url: order.confirmationUrl }]);
  }

  rows.push([{ text: "💬 Чат с поддержкой", callback_data: CB.chat(order.id) }]);
  rows.push([{ text: "← К заказам", callback_data: CB.orders() }]);

  return rows;
}

export function supportOrderListKeyboard(
  orders: { id: string; planName: string; unreadCount: number }[],
  page: number,
  hasMore: boolean,
): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = orders.map((o) => [
    {
      text: `${o.unreadCount > 0 ? "🔴 " : ""}${o.planName}`.slice(0, 60),
      callback_data: CB.supportOrder(o.id),
    },
  ]);

  const nav: InlineKeyboardButton[] = [];
  if (page > 0) {
    nav.push({ text: "← Ранее", callback_data: CB.supportOrders(page - 1) });
  }
  if (hasMore) {
    nav.push({ text: "Далее →", callback_data: CB.supportOrders(page + 1) });
  }
  if (nav.length) rows.push(nav);

  return rows;
}

export function supportOrderActionsKeyboard(orderId: string): InlineKeyboardButton[][] {
  return [
    [{ text: "💬 Ответить", callback_data: CB.supportChat(orderId) }],
    [{ text: "📦 Выдать доступ", callback_data: CB.supportFulfill(orderId) }],
    [{ text: "← К списку", callback_data: CB.supportOrders(0) }],
  ];
}
