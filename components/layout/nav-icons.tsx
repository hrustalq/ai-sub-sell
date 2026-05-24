"use client";

import {
  LayoutDashboardIcon,
  PackageIcon,
  UsersIcon,
  CreditCardIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import type { AppNavItem, AppNavItemConfig, NavIconName } from "@/lib/navigation/types";

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  package: PackageIcon,
  users: UsersIcon,
  "credit-card": CreditCardIcon,
  user: UserIcon,
};

export function resolveNavItems(items: AppNavItemConfig[]): AppNavItem[] {
  return items.map((item) => ({
    ...item,
    icon: NAV_ICONS[item.icon],
  }));
}
