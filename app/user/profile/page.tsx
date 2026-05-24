import { requireSession } from "@/lib/auth-session";
import { isAdminEmail } from "@/lib/admin/auth";
import { getUserInitials } from "@/lib/user/initials";
import { PageShell } from "@/components/layout/page-shell";
import { UserProfileCard } from "@/app/user/_components/user-profile-card";

export default async function UserProfilePage() {
  const session = await requireSession("/user/profile");
  const user = session.user;

  return (
    <PageShell fill title="Профиль" description="Данные вашего аккаунта">
      <UserProfileCard
        user={{
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          initials: getUserInitials(user.name, user.email),
          emailVerified: user.emailVerified,
          isAdmin: isAdminEmail(user.email),
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        }}
      />
    </PageShell>
  );
}
