import type { AppNavItemConfig } from "@/lib/navigation/types";

export type AdminNavItem = AppNavItemConfig;

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Обзор", icon: "layout-dashboard", exact: true },
  { href: "/admin/plans", label: "Тарифы", icon: "package" },
  { href: "/admin/users", label: "Пользователи", icon: "users" },
  { href: "/admin/payments", label: "Платежи", icon: "credit-card" },
  { href: "/support", label: "Поддержка", icon: "message-square" },
];
