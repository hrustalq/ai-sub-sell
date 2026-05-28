import type { PlanData, ProviderMeta } from "@/lib/plans/types";

export type { ProviderMeta };

export const DEFAULT_PROVIDERS: ProviderMeta[] = [
  {
    id: "codex",
    label: "Codex",
    description: "Расширенные лимиты OpenAI Codex для кодинга и автоматизации",
    sortOrder: 0,
  },
  {
    id: "cursor",
    label: "Cursor",
    description: "Подписка Cursor Pro / Business с повышенными лимитами AI",
    sortOrder: 1,
  },
  {
    id: "claude",
    label: "Claude",
    description: "Доступ к Claude Code и повышенным лимитам Anthropic",
    sortOrder: 2,
  },
];

export const DURATION_OPTIONS = [
  { months: 1, discount: 0, label: "1 мес" },
  { months: 3, discount: 0.1, label: "3 мес" },
  { months: 6, discount: 0.15, label: "6 мес" },
  { months: 12, discount: 0.2, label: "12 мес" },
] as const;

type TierTemplate = {
  id: string;
  label: string;
  monthlyPrice: Record<string, number>;
  limits: string[];
  highlight?: boolean;
  badge?: string | null;
  tag?: string | null;
  durations?: number[];
};

const TIER_TEMPLATES: TierTemplate[] = [
  {
    id: "trial",
    label: "Пробный",
    monthlyPrice: { codex: 550, cursor: 490, claude: 520 },
    limits: ["50 запросов в день", "200 в неделю"],
    tag: "Старт",
    durations: [0],
  },
  {
    id: "standard",
    label: "Стандарт",
    monthlyPrice: { codex: 4900, cursor: 3900, claude: 4500 },
    limits: ["100 в день", "300 в неделю", "500 в месяц"],
    durations: [1, 3, 6, 12],
  },
  {
    id: "pro",
    label: "Про",
    monthlyPrice: { codex: 8200, cursor: 6900, claude: 7500 },
    limits: ["400 в день", "1 000 в неделю", "2 000 в месяц"],
    badge: "Популярный",
    highlight: true,
    durations: [1, 3, 6, 12],
  },
];

export function formatDurationPeriod(months: number): string {
  if (months === 0) return "неделю";
  if (months === 1) return "месяц";
  if (months === 3) return "3 месяца";
  if (months === 6) return "6 месяцев";
  if (months === 12) return "12 месяцев";
  return `${months} мес.`;
}

function buildPlanName(provider: ProviderMeta, tier: TierTemplate, months: number): string {
  const duration =
    months === 0 ? "неделя" : months === 1 ? "1 месяц" : `${months} месяцев`;
  return `${provider.label} — ${tier.label} (${duration})`;
}

export function buildDefaultPlans(providers: ProviderMeta[] = DEFAULT_PROVIDERS): PlanData[] {
  const plans: PlanData[] = [];

  for (const provider of providers) {
    for (const tier of TIER_TEMPLATES) {
      const durations = tier.durations ?? [1, 3, 6, 12];
      const monthlyBase = tier.monthlyPrice[provider.id];
      if (monthlyBase == null) continue;

      for (const months of durations) {
        const durationOpt =
          months === 0
            ? null
            : DURATION_OPTIONS.find((d) => d.months === months);

        const discount = durationOpt?.discount ?? 0;
        const fullPrice = months === 0 ? monthlyBase : Math.round(monthlyBase * months);
        const price =
          months === 0 ? monthlyBase : Math.round(fullPrice * (1 - discount));

        const id =
          months === 0
            ? `${provider.id}-${tier.id}-week`
            : `${provider.id}-${tier.id}-${months}m`;

        const highlight =
          tier.highlight === true &&
          months === 3 &&
          tier.id === "pro" &&
          provider.id === "codex";

        plans.push({
          id,
          name: buildPlanName(provider, tier, months),
          price,
          currency: "RUB",
          period: formatDurationPeriod(months),
          limits: tier.limits,
          tag: tier.tag ?? null,
          badge: highlight ? (tier.badge ?? null) : months === 12 ? "−20%" : null,
          highlight,
          provider: provider.id,
          tier: tier.id,
          tierLabel: tier.label,
          durationMonths: months,
          compareAtPrice: discount > 0 ? fullPrice : null,
        });
      }
    }
  }

  return plans.map((plan, index) => ({ ...plan, sortOrder: index }));
}
