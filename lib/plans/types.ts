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

export type ProviderMeta = {
  id: string;
  label: string;
  description: string;
  sortOrder: number;
  active?: boolean;
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
