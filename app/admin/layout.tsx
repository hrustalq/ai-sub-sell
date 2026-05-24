import { requireAdmin } from "@/lib/admin";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import { AppShell } from "@/components/layout/app-shell";

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
