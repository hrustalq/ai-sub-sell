import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/auth";

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getSupportEmails(): string[] {
  const support = parseEmailList(process.env.SUPPORT_EMAILS ?? "");
  const admin = parseEmailList(process.env.ADMIN_EMAILS ?? "");
  return [...new Set([...support, ...admin])];
}

export function isSupportEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getSupportEmails();
  if (allowed.length === 0) return isAdminEmail(email);
  return allowed.includes(email.trim().toLowerCase());
}

export async function getSupportSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isSupportEmail(session.user.email)) {
    return null;
  }
  return session;
}

export async function requireSupport() {
  const session = await getSupportSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/support");
  }
  return session;
}
