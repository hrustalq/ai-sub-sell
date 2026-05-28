/** Canonical in-app paths — use these instead of hardcoded strings. */
export const routes = {
  admin: {
    home: "/admin",
    plans: "/admin/plans",
    planNew: "/admin/plans/new",
    planEdit: (planId: string) => `/admin/plans/${planId}/edit`,
    users: "/admin/users",
    user: (userId: string) => `/admin/users/${userId}`,
    payments: "/admin/payments",
    support: "/admin/support",
    supportChats: "/admin/support/chats",
    supportTelegram: "/admin/support/telegram",
    supportOrder: (orderId: string) => `/admin/support/${orderId}`,
    supportConversation: (conversationId: string) => `/admin/support/chats/${conversationId}`,
    counterparties: "/admin/counterparties",
    counterpartyNew: "/admin/counterparties/new",
    counterpartyEdit: (counterpartyId: string) => `/admin/counterparties/${counterpartyId}/edit`,
  },
  order: (orderId: string) => `/orders/${orderId}`,
} as const;

export function legacySupportPath(pathname: string): string | null {
  if (!pathname.startsWith("/support")) return null;
  return pathname.replace(/^\/support/, routes.admin.support);
}

export function normalizeCallbackUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl) return "/";
  if (!callbackUrl.startsWith("/")) return "/";
  return legacySupportPath(callbackUrl) ?? callbackUrl;
}
