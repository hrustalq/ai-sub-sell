import type { PlanData } from "@/lib/plans/types";
import { formatDurationPeriod } from "@/lib/plans/catalog";

export const PLAN_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,48}$/;

export type PlanInput = Omit<PlanData, "id"> & {
  id?: string;
  active: boolean;
  sortOrder: number;
};

export function parsePlanInput(body: unknown): PlanInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Некорректное тело запроса" };
  }

  const data = body as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const period = typeof data.period === "string" ? data.period.trim() : "";
  const currency =
    typeof data.currency === "string" && data.currency.trim()
      ? data.currency.trim().toUpperCase()
      : "RUB";
  const provider =
    typeof data.provider === "string" && data.provider.trim()
      ? data.provider.trim().toLowerCase()
      : "";
  const tier =
    typeof data.tier === "string" && data.tier.trim() ? data.tier.trim().toLowerCase() : "";
  const tierLabel =
    typeof data.tierLabel === "string" && data.tierLabel.trim()
      ? data.tierLabel.trim()
      : "";

  const price = Number(data.price);
  const sortOrder = Number(data.sortOrder ?? 0);
  const durationMonths = Number(data.durationMonths ?? 1);
  const compareAtRaw = data.compareAtPrice;
  const compareAtPrice =
    compareAtRaw === null || compareAtRaw === "" || compareAtRaw === undefined
      ? null
      : Number(compareAtRaw);

  let limits: string[] = [];
  if (Array.isArray(data.limits)) {
    limits = data.limits
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  } else if (typeof data.limits === "string") {
    limits = data.limits
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const tag =
    typeof data.tag === "string" && data.tag.trim() ? data.tag.trim() : null;
  const badge =
    typeof data.badge === "string" && data.badge.trim() ? data.badge.trim() : null;

  if (!name) return { error: "Укажите название тарифа" };
  if (!provider) return { error: "Укажите провайдера" };
  if (!tier) return { error: "Укажите опцию (tier)" };
  if (!tierLabel) return { error: "Укажите название опции" };
  if (!Number.isFinite(price) || price <= 0) return { error: "Укажите корректную цену" };
  if (!Number.isFinite(sortOrder)) return { error: "Укажите корректный порядок сортировки" };
  if (!Number.isFinite(durationMonths) || durationMonths < 0) {
    return { error: "Укажите корректный срок (в месяцах)" };
  }
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= 0)) {
    return { error: "Старая цена должна быть положительным числом" };
  }
  if (limits.length === 0) return { error: "Добавьте хотя бы один лимит" };

  const resolvedPeriod = period || formatDurationPeriod(durationMonths);

  const id =
    typeof data.id === "string" && data.id.trim() ? data.id.trim().toLowerCase() : undefined;

  if (id && !PLAN_ID_PATTERN.test(id)) {
    return {
      error: "ID тарифа: латиница, цифры, дефис или подчёркивание (2–49 символов)",
    };
  }

  return {
    id,
    name,
    price,
    currency,
    period: resolvedPeriod,
    limits,
    tag,
    badge,
    highlight: Boolean(data.highlight),
    active: data.active !== false,
    sortOrder: Math.round(sortOrder),
    provider,
    tier,
    tierLabel,
    durationMonths: Math.round(durationMonths),
    compareAtPrice,
  };
}
