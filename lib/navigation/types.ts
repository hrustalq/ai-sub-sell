import type { LucideIcon } from "lucide-react";

export type NavIconName =
  | "layout-dashboard"
  | "package"
  | "users"
  | "credit-card"
  | "user";

/** Serializable nav item — safe to pass from Server Components. */
export type AppNavItemConfig = {
  href: string;
  label: string;
  icon: NavIconName;
  exact?: boolean;
};

/** Resolved nav item with icon component (client-only). */
export type AppNavItem = Omit<AppNavItemConfig, "icon"> & {
  icon: LucideIcon;
};

export type AppShellBrand = {
  href: string;
  title: string;
  accent?: string;
};
