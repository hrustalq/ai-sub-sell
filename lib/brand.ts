export const SITE_NAME = "ai-sub";

export const SITE_DOMAIN = "ai-sub.store";

export const SITE_TITLE = `${SITE_NAME} — подписки Codex, Cursor, Claude`;

export const SITE_DESCRIPTION =
  "Подписки на AI-инструменты для разработки: Codex, Cursor, Claude. Скидки за 3, 6 и 12 месяцев.";

export function pageTitle(segment: string): string {
  return `${segment} — ${SITE_NAME}`;
}
