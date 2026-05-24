import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth-session";
import { noIndexMetadata } from "@/lib/seo";
import { USER_NAV_ITEMS } from "@/lib/user/navigation";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = noIndexMetadata();

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <AppShell
      brand={{ href: "/user/profile", title: "Кабинет", accent: "." }}
      navItems={USER_NAV_ITEMS}
      userEmail={session.user.email}
      exitHref="/"
      exitLabel="На сайт"
    >
      {children}
    </AppShell>
  );
}
