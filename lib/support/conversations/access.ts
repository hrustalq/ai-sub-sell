import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPermissionsById } from "@/lib/rbac";
import db from "@/lib/db";
import type { OrderMessageAuthor } from "@/lib/orders/messages";

export type SupportConversationAccessContext = {
  conversationId: string;
  authorRole: OrderMessageAuthor;
};

export async function getSupportConversationAccessContext(
  conversationId: string,
): Promise<SupportConversationAccessContext | null> {
  const conversation = await db.supportConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });

  if (!conversation) return null;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const permissions = await getUserPermissionsById(session.user.id, session.user.email);
  if (permissions?.canAccessSupport) {
    return {
      conversationId,
      authorRole: "seller",
    };
  }

  return null;
}
