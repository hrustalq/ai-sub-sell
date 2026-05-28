import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPermissionsById } from "@/lib/rbac";

export async function getSupportSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const permissions = await getUserPermissionsById(session.user.id, session.user.email);
  if (!permissions?.canAccessSupport) return null;

  return session;
}

export async function isSupportUser(userId: string, email: string): Promise<boolean> {
  const permissions = await getUserPermissionsById(userId, email);
  return permissions?.canAccessSupport ?? false;
}

export { requireSupport } from "@/lib/admin/auth";
