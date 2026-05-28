import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getUserPermissionsById,
  type UserPermissions,
} from "@/lib/rbac";
import { routes } from "@/lib/routes";

export type AdminSession = Awaited<ReturnType<typeof auth.api.getSession>> & {
  user: NonNullable<NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"]>;
};

export type AdminPanelSession = {
  session: AdminSession;
  permissions: UserPermissions;
};

async function getSessionPermissions(): Promise<AdminPanelSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const permissions = await getUserPermissionsById(session.user.id, session.user.email);
  if (!permissions?.canAccessAdminPanel) return null;

  return { session: session as AdminSession, permissions };
}

export async function getAdminPanelSession(): Promise<AdminPanelSession | null> {
  return getSessionPermissions();
}

export async function requireAdminPanel(): Promise<AdminPanelSession> {
  const result = await getSessionPermissions();
  if (!result) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(routes.admin.home)}`);
  }
  return result;
}

export async function requireAdmin(): Promise<AdminPanelSession> {
  const result = await requireAdminPanel();
  if (!result.permissions.canAccessAdmin) {
    redirect(routes.admin.support);
  }
  return result;
}

export async function requireSupport(): Promise<AdminPanelSession> {
  const result = await requireAdminPanel();
  if (!result.permissions.canAccessSupport) {
    redirect(routes.admin.home);
  }
  return result;
}

export async function requireCoreAdmin(): Promise<AdminPanelSession> {
  const result = await requireAdminPanel();
  if (!result.permissions.canManageRbac) {
    redirect(routes.admin.home);
  }
  return result;
}

/** @deprecated Use permissions from requireAdminPanel instead. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}

export async function getAdminSession() {
  const result = await getSessionPermissions();
  if (!result?.permissions.canAccessAdmin) return null;
  return result.session;
}
