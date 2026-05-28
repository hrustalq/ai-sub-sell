import "server-only";

import db from "@/lib/db";

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getSupportNotificationEmails(): Promise<string[]> {
  const support = parseEmailList(process.env.SUPPORT_EMAILS ?? "");
  const admin = parseEmailList(process.env.ADMIN_EMAILS ?? "");
  const coreAdmin = parseEmailList(process.env.CORE_ADMIN_EMAILS ?? "");

  const rbacUsers = await db.user.findMany({
    where: {
      OR: [{ rbacSupport: true }, { rbacAdmin: true }],
    },
    select: { email: true },
  });

  const combined = [
    ...support,
    ...admin,
    ...coreAdmin,
    ...rbacUsers.map((user) => user.email.trim().toLowerCase()),
  ];

  const unique = [...new Set(combined)];
  if (unique.length > 0) return unique;

  const fallback = process.env.SMTP_FROM_EMAIL?.trim().toLowerCase();
  return fallback ? [fallback] : [];
}
