export type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  limits: string[];
  tag: string | null;
  badge: string | null;
  highlight: boolean;
  active: boolean;
  sortOrder: number;
  provider: string;
  tier: string;
  tierLabel: string;
  durationMonths: number;
  compareAtPrice: number | null;
};

/** Plan fields for create/upsert (DB row without `active` required). */
export type PlanData = Omit<Plan, "active" | "sortOrder"> & {
  active?: boolean;
  sortOrder?: number;
};

export type ProviderId = "codex" | "cursor" | "claude";

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  description: string;
  sortOrder: number;
};

export type PricingTierGroup = {
  id: string;
  label: string;
  limits: string[];
  tag: string | null;
  highlight: boolean;
  options: Plan[];
};

export type PricingProviderGroup = {
  id: string;
  label: string;
  description: string;
  tiers: PricingTierGroup[];
};
