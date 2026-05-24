import type { AppNavItemConfig } from "@/lib/navigation/types";

export const USER_NAV_ITEMS: AppNavItemConfig[] = [
  { href: "/user/profile", label: "Профиль", icon: "user", exact: true },
  { href: "/user/payments", label: "Платежи", icon: "credit-card" },
];
