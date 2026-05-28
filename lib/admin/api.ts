import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPermissionsById, type UserPermissions } from "@/lib/rbac";

export type AdminApiSession = Awaited<ReturnType<typeof auth.api.getSession>> & {
  user: NonNullable<NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"]>;
};

export type AdminApiContext = {
  session: AdminApiSession;
  permissions: UserPermissions;
};

async function getAdminApiContext(): Promise<AdminApiContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const permissions = await getUserPermissionsById(session.user.id, session.user.email);
  if (!permissions?.canAccessAdminPanel) return null;

  return { session: session as AdminApiSession, permissions };
}

export async function requireAdminPanelApi(): Promise<AdminApiContext | null> {
  return getAdminApiContext();
}

export async function requireAdminApi(): Promise<AdminApiContext | null> {
  const context = await getAdminApiContext();
  if (!context?.permissions.canAccessAdmin) return null;
  return context;
}

export async function requireSupportApi(): Promise<AdminApiContext | null> {
  const context = await getAdminApiContext();
  if (!context?.permissions.canAccessSupport) return null;
  return context;
}

export async function requireCoreAdminApi(): Promise<AdminApiContext | null> {
  const context = await getAdminApiContext();
  if (!context?.permissions.canManageRbac) return null;
  return context;
}
