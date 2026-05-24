import type { Metadata } from "next";

import { isAdminEmail } from "@/lib/admin/auth";
import { noIndexMetadata } from "@/lib/seo";
import { requireSupport } from "@/lib/support";
import { SUPPORT_NAV_ITEMS } from "@/lib/support/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SupportNotificationsProvider } from "@/app/support/_components/support-notifications-provider";

export const metadata: Metadata = noIndexMetadata();

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSupport();
  const isAdmin = isAdminEmail(session.user.email);

  return (
    <AppShell
      brand={{ href: "/support", title: "Поддержка", accent: "" }}
      navItems={SUPPORT_NAV_ITEMS}
      userEmail={session.user.email}
      exitHref={isAdmin ? "/admin" : "/"}
      exitLabel={isAdmin ? "Админ" : "На сайт"}
    >
      <SupportNotificationsProvider>{children}</SupportNotificationsProvider>
    </AppShell>
  );
}
