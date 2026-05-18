export const PLANS = {
  weekly: {
    id: "weekly",
    name: "Недельный (Промо)",
    price: 550,
    currency: "RUB",
    period: "неделю",
    limits: ["50 в день", "200 в неделю"],
    tag: "Пробный",
    badge: null as string | null,
    highlight: false,
  },
  standard15: {
    id: "standard15",
    name: "Стандарт — 15 дней",
    price: 2700,
    currency: "RUB",
    period: "15 дней",
    limits: ["100 в день", "300 в неделю", "500 в месяц"],
    tag: null as string | null,
    badge: null as string | null,
    highlight: false,
  },
  stable30: {
    id: "stable30",
    name: "Стабильный — 30 дней",
    price: 4900,
    currency: "RUB",
    period: "месяц",
    limits: ["200 в день", "500 в неделю", "1 000 в месяц"],
    tag: null as string | null,
    badge: "Популярный" as string | null,
    highlight: true,
  },
  pro30: {
    id: "pro30",
    name: "Про — 30 дней",
    price: 8200,
    currency: "RUB",
    period: "месяц",
    limits: ["400 в день", "1 000 в неделю", "2 000 в месяц"],
    tag: null as string | null,
    badge: "Максимум" as string | null,
    highlight: false,
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

export function getPlan(id: string): Plan | null {
  return (PLANS as Record<string, Plan>)[id] ?? null;
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
