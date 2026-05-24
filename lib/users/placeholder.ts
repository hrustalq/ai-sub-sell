import "server-only";

import db from "@/lib/db";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findOrCreatePlaceholderUser(email: string) {
  const normalized = normalizeEmail(email);

  const existing = await db.user.findUnique({
    where: { email: normalized },
  });

  if (existing) {
    return existing;
  }

  const localPart = normalized.split("@")[0] ?? "user";
  const displayName =
    localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[._-]/g, " ");

  return db.user.create({
    data: {
      id: crypto.randomUUID(),
      email: normalized,
      name: displayName || "Покупатель",
      emailVerified: false,
    },
  });
}

export async function linkOrdersToUserByEmail(userId: string, email: string) {
  const normalized = normalizeEmail(email);

  await db.order.updateMany({
    where: {
      buyerEmail: normalized,
      userId: null,
    },
    data: { userId },
  });
}

export async function resolveBuyerUserId(
  sessionUserId: string | null | undefined,
  buyerEmail: string,
): Promise<string> {
  if (sessionUserId) {
    await linkOrdersToUserByEmail(sessionUserId, buyerEmail);
    return sessionUserId;
  }

  const user = await findOrCreatePlaceholderUser(buyerEmail);
  await linkOrdersToUserByEmail(user.id, buyerEmail);
  return user.id;
}
