import type { Metadata } from "next";

import { requireAdminPanel } from "@/lib/admin";
import { noIndexMetadata } from "@/lib/seo";
import { getAdminNavItems, getAdminPanelHomeHref } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { SupportNotificationsProvider } from "@/app/admin/_components/support-notifications-provider";

export const metadata: Metadata = noIndexMetadata();

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, permissions } = await requireAdminPanel();
  const navItems = getAdminNavItems(permissions);
  const homeHref = getAdminPanelHomeHref(permissions);

  const content = permissions.canAccessSupport ? (
    <SupportNotificationsProvider>{children}</SupportNotificationsProvider>
  ) : (
    children
  );

  return (
    <AppShell
      brand={{ href: homeHref, title: "Админ", accent: "." }}
      navItems={navItems}
      userEmail={session.user.email}
      exitHref="/"
      exitLabel="На сайт"
    >
      {content}
    </AppShell>
  );
}
