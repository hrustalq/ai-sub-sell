import type { AppNavItemConfig } from "@/lib/navigation/types";

type NavMatchItem = Pick<AppNavItemConfig, "href" | "exact">;

export function navItemMatches(pathname: string, item: NavMatchItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Prefer the longest matching href so sibling routes don't both appear active. */
export function getActiveNavHref(pathname: string, items: NavMatchItem[]): string | null {
  let activeHref: string | null = null;

  for (const item of items) {
    if (!navItemMatches(pathname, item)) continue;
    if (!activeHref || item.href.length > activeHref.length) {
      activeHref = item.href;
    }
  }

  return activeHref;
}
