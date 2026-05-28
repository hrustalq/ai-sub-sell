import type { ProviderMeta } from "@/lib/plans/types";

export const PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,31}$/;

export type ProviderInput = {
  id?: string;
  label: string;
  description: string;
  sortOrder: number;
  active: boolean;
};

export function parseProviderInput(body: unknown): ProviderInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Некорректное тело запроса" };
  }

  const data = body as Record<string, unknown>;

  const label = typeof data.label === "string" ? data.label.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const sortOrder = Number(data.sortOrder ?? 0);

  const id =
    typeof data.id === "string" && data.id.trim()
      ? data.id.trim().toLowerCase()
      : undefined;

  if (!label) return { error: "Укажите название провайдера" };
  if (!Number.isFinite(sortOrder)) {
    return { error: "Укажите корректный порядок сортировки" };
  }

  if (id && !PROVIDER_ID_PATTERN.test(id)) {
    return {
      error: "ID провайдера: латиница, цифры, дефис или подчёркивание (2–32 символа)",
    };
  }

  return {
    id,
    label,
    description,
    sortOrder: Math.round(sortOrder),
    active: data.active !== false,
  };
}

export function findProviderMeta(
  providerId: string,
  providers: ProviderMeta[],
): ProviderMeta | undefined {
  return providers.find((provider) => provider.id === providerId);
}

export function getProviderLabel(
  providerId: string,
  providers: ProviderMeta[],
): string {
  return findProviderMeta(providerId, providers)?.label ?? providerId;
}
