import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSupportEmail } from "@/lib/support/auth";
import db from "@/lib/db";

export function generateOrderAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOrderAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokensMatch(storedHash: string, token: string): boolean {
  const candidate = hashOrderAccessToken(token);
  try {
    return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

export type OrderAccessContext = {
  orderId: string;
  isOwner: boolean;
  isAdmin: boolean;
  canManageFulfillment: boolean;
  authorRole: "buyer" | "seller";
};

export async function getOrderAccessContext(
  orderId: string,
  token?: string | null,
): Promise<OrderAccessContext | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, buyerEmail: true, accessTokenHash: true },
  });
  if (!order) return null;

  const session = await auth.api.getSession({ headers: await headers() });
  const sessionUserId = session?.user?.id ?? null;
  const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? null;
  const isStaff = isSupportEmail(sessionEmail);

  const hasValidToken = Boolean(token && tokensMatch(order.accessTokenHash, token));
  const isOwnerByUserId = Boolean(
    sessionUserId && order.userId && order.userId === sessionUserId,
  );
  const isOwnerByEmail = Boolean(
    sessionEmail && order.buyerEmail.trim().toLowerCase() === sessionEmail,
  );
  const isOwner = isOwnerByUserId || isOwnerByEmail;

  if (!hasValidToken && !isOwner && !isStaff) {
    return null;
  }

  return {
    orderId: order.id,
    isOwner: isOwner || hasValidToken,
    isAdmin: isStaff,
    canManageFulfillment: isStaff,
    authorRole: isStaff ? "seller" : "buyer",
  };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
