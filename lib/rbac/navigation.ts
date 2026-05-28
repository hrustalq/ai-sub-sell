import type { AppNavItemConfig } from "@/lib/navigation/types";
import type { UserPermissions } from "@/lib/rbac/types";
import { routes } from "@/lib/routes";

export type AdminNavItemConfig = AppNavItemConfig & {
  permission: "admin" | "support";
};

export const ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  {
    href: routes.admin.home,
    label: "Обзор",
    icon: "layout-dashboard",
    exact: true,
    permission: "admin",
  },
  { href: routes.admin.plans, label: "Тарифы", icon: "package", permission: "admin" },
  { href: routes.admin.counterparties, label: "Контрагенты", icon: "building-2", permission: "admin" },
  { href: routes.admin.users, label: "Пользователи", icon: "users", permission: "admin" },
  { href: routes.admin.payments, label: "Платежи", icon: "credit-card", permission: "admin" },
  { href: routes.admin.support, label: "Заказы", icon: "message-square", permission: "support" },
  { href: routes.admin.supportChats, label: "Обращения", icon: "messages-square", permission: "support" },
  {
    href: routes.admin.supportTelegram,
    label: "Telegram",
    icon: "headphones",
    exact: true,
    permission: "support",
  },
];

export function getAdminNavItems(permissions: UserPermissions): AppNavItemConfig[] {
  return ADMIN_NAV_ITEMS.filter((item) => {
    if (item.permission === "admin") return permissions.canAccessAdmin;
    return permissions.canAccessSupport;
  });
}

export function getAdminPanelHomeHref(permissions: UserPermissions): string {
  if (permissions.canAccessAdmin) return routes.admin.home;
  return routes.admin.support;
}
