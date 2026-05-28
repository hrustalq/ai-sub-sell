import "server-only";

import db from "@/lib/db";
import { isCoreAdminEmail } from "@/lib/rbac/core-admin";
import type { UserPermissions, UserRbacFlags } from "@/lib/rbac/types";

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isLegacyAdminEmail(email: string): boolean {
  const admins = parseEmailList(process.env.ADMIN_EMAILS ?? "");
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}

function isLegacySupportEmail(email: string): boolean {
  const support = parseEmailList(process.env.SUPPORT_EMAILS ?? "");
  if (support.length === 0) return isLegacyAdminEmail(email);
  return support.includes(email.trim().toLowerCase());
}

export function resolveUserPermissions(
  flags: UserRbacFlags,
  email: string,
): UserPermissions {
  const normalizedEmail = email.trim().toLowerCase();
  const isCoreAdmin = isCoreAdminEmail(normalizedEmail);
  const legacyAdmin = isLegacyAdminEmail(normalizedEmail);
  const legacySupport = isLegacySupportEmail(normalizedEmail);

  const canAccessAdmin =
    isCoreAdmin || flags.rbacAdmin || legacyAdmin;
  const canAccessSupport =
    isCoreAdmin || flags.rbacSupport || flags.rbacAdmin || legacySupport || legacyAdmin;

  return {
    isCoreAdmin,
    rbacAdmin: flags.rbacAdmin,
    rbacSupport: flags.rbacSupport,
    canAccessAdminPanel: canAccessAdmin || canAccessSupport,
    canAccessAdmin,
    canAccessSupport,
    canManageRbac: isCoreAdmin,
  };
}

export async function getUserPermissionsById(
  userId: string,
  email: string,
): Promise<UserPermissions | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { rbacAdmin: true, rbacSupport: true },
  });
  if (!user) return null;
  return resolveUserPermissions(user, email);
}

export async function getUserPermissionsByEmail(
  email: string,
): Promise<UserPermissions | null> {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { rbacAdmin: true, rbacSupport: true },
  });
  if (!user) return null;
  return resolveUserPermissions(user, email);
}
