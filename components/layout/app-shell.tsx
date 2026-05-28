"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import type { AppNavItemConfig, AppShellBrand } from "@/lib/navigation/types";
import { AppNavLink } from "@/components/layout/app-nav-link";
import { resolveNavItems } from "@/components/layout/nav-icons";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  brand: AppShellBrand;
  navItems: AppNavItemConfig[];
  userEmail: string;
  exitHref?: string;
  exitLabel?: string;
  children: React.ReactNode;
};

function BrandMark({ title, accent }: AppShellBrand) {
  return (
    <>
      {title}
      {accent ? <span className="text-primary">{accent}</span> : null}
    </>
  );
}

export function AppShell({
  brand,
  navItems,
  userEmail,
  exitHref = "/",
  exitLabel = "На сайт",
  children,
}: AppShellProps) {
  const resolvedNavItems = resolveNavItems(navItems);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-muted/30">
      <aside className="hidden h-full w-(--layout-app-sidebar-width) shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="flex h-(--layout-app-header-height) shrink-0 items-center border-b border-border px-5">
          <Link
            href={brand.href}
            className="text-base font-semibold tracking-tight text-foreground"
          >
            <BrandMark {...brand} />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {resolvedNavItems.map((item) => (
            <AppNavLink key={item.href} item={item} variant="sidebar" />
          ))}
        </nav>

        <div className="shrink-0 border-t border-border p-4">
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          {exitHref && (
            <Link
              href={exitHref}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              <ExternalLinkIcon className="size-3.5" />
              {exitLabel}
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-(--layout-app-header-height) shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <Link
            href={brand.href}
            className="text-base font-semibold tracking-tight text-foreground"
          >
            <BrandMark {...brand} />
          </Link>
          {exitHref && (
            <Link
              href={exitHref}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {exitLabel}
            </Link>
          )}
        </header>

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col p-4 md:p-6",
            "pb-[calc(var(--layout-app-mobile-nav-height)+0.5rem+env(safe-area-inset-bottom,0))] md:pb-6",
          )}
        >
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-(--layout-app-mobile-nav-height) border-t border-border bg-background/95 backdrop-blur md:hidden">
        {resolvedNavItems.map((item) => (
          <AppNavLink key={item.href} item={item} variant="bottom" />
        ))}
      </nav>
    </div>
  );
}
