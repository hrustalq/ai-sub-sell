import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin";
import { noIndexMetadata } from "@/lib/seo";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = noIndexMetadata();

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <AppShell
      brand={{ href: "/admin", title: "Админ", accent: "." }}
      navItems={ADMIN_NAV_ITEMS}
      userEmail={session.user.email}
      exitHref="/"
      exitLabel="На сайт"
    >
      {children}
    </AppShell>
  );
}
