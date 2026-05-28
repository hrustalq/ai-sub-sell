import type { CounterpartyPricingOption } from "@/lib/counterparties/types";

export type CounterpartyPricingOptionInput = {
  id?: string;
  label: string;
  price: number;
  currency: string;
  notes: string;
  sortOrder: number;
  active: boolean;
};

export type CounterpartyInput = {
  id?: string;
  name: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  wechatId: string;
  shopUrl: string;
  active: boolean;
  sortOrder: number;
  pricingOptions: CounterpartyPricingOptionInput[];
};

function parseOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePricingOptionInput(
  value: unknown,
  index: number,
): CounterpartyPricingOptionInput | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: `Позиция ${index + 1}: некорректные данные` };
  }

  const data = value as Record<string, unknown>;
  const label = parseOptionalString(data.label);
  const price = Number(data.price);
  const currency = parseOptionalString(data.currency) || "CNY";
  const notes = parseOptionalString(data.notes);
  const sortOrder = Number(data.sortOrder ?? index);
  const id =
    typeof data.id === "string" && data.id.trim() ? data.id.trim() : undefined;

  if (!label) {
    return { error: `Позиция ${index + 1}: укажите название` };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: `Позиция ${index + 1}: укажите корректную цену` };
  }
  if (!Number.isFinite(sortOrder)) {
    return { error: `Позиция ${index + 1}: укажите корректный порядок сортировки` };
  }

  return {
    id,
    label,
    price,
    currency: currency.toUpperCase(),
    notes,
    sortOrder: Math.round(sortOrder),
    active: data.active !== false,
  };
}

export function parseCounterpartyInput(body: unknown): CounterpartyInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Некорректное тело запроса" };
  }

  const data = body as Record<string, unknown>;
  const name = parseOptionalString(data.name);
  const notes = parseOptionalString(data.notes);
  const contactName = parseOptionalString(data.contactName);
  const contactEmail = parseOptionalString(data.contactEmail);
  const contactPhone = parseOptionalString(data.contactPhone);
  const wechatId = parseOptionalString(data.wechatId);
  const shopUrl = parseOptionalString(data.shopUrl);
  const sortOrder = Number(data.sortOrder ?? 0);
  const id =
    typeof data.id === "string" && data.id.trim() ? data.id.trim() : undefined;

  if (!name) return { error: "Укажите название контрагента" };
  if (!Number.isFinite(sortOrder)) {
    return { error: "Укажите корректный порядок сортировки" };
  }

  if (shopUrl) {
    try {
      new URL(shopUrl);
    } catch {
      return { error: "Укажите корректную ссылку на магазин" };
    }
  }

  const rawOptions = Array.isArray(data.pricingOptions) ? data.pricingOptions : [];
  const pricingOptions: CounterpartyPricingOptionInput[] = [];

  for (let index = 0; index < rawOptions.length; index += 1) {
    const parsed = parsePricingOptionInput(rawOptions[index], index);
    if ("error" in parsed) return parsed;
    pricingOptions.push(parsed);
  }

  return {
    id,
    name,
    notes,
    contactName,
    contactEmail,
    contactPhone,
    wechatId,
    shopUrl,
    active: data.active !== false,
    sortOrder: Math.round(sortOrder),
    pricingOptions,
  };
}

export function sortPricingOptions(
  options: CounterpartyPricingOption[],
): CounterpartyPricingOption[] {
  return [...options].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}
