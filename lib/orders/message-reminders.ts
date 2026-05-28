import "server-only";

import db from "@/lib/db";
import { getSupportNotificationEmails } from "@/lib/email/support-recipients";
import type { MessageViewer } from "@/lib/orders/read-state";
import { getOrderUnreadCount } from "@/lib/orders/read-state";
import { sendNewMessageEmail } from "@/lib/orders/emails";
import { createLogger, logError } from "@/lib/logger";

const log = createLogger("message-reminder");
const REMINDER_DELAY_MS = 10 * 60 * 1000;

export async function scheduleMessageEmailReminders(params: {
  orderId: string;
  messageId: string;
  messageAuthor: "buyer" | "seller";
  buyerEmail: string;
  planName: string;
}): Promise<void> {
  const sendAfter = new Date(Date.now() + REMINDER_DELAY_MS);
  const recipients: { email: string; viewer: MessageViewer }[] = [];

  if (params.messageAuthor === "seller") {
    recipients.push({ email: params.buyerEmail, viewer: "buyer" });
  } else {
    for (const email of await getSupportNotificationEmails()) {
      recipients.push({ email, viewer: "seller" });
    }
  }

  if (recipients.length === 0) return;

  await db.orderMessageEmailReminder.createMany({
    data: recipients.map((recipient) => ({
      id: crypto.randomUUID(),
      orderId: params.orderId,
      messageId: params.messageId,
      recipientEmail: recipient.email,
      viewer: recipient.viewer,
      sendAfter,
    })),
  });
}

export async function cancelMessageEmailReminders(
  orderId: string,
  viewer: MessageViewer,
): Promise<void> {
  await db.orderMessageEmailReminder.updateMany({
    where: {
      orderId,
      viewer,
      sentAt: null,
      canceledAt: null,
    },
    data: { canceledAt: new Date() },
  });
}

export async function processDueMessageEmailReminders(): Promise<{
  processed: number;
  sent: number;
}> {
  const now = new Date();

  const due = await db.orderMessageEmailReminder.findMany({
    where: {
      sendAfter: { lte: now },
      sentAt: null,
      canceledAt: null,
    },
    take: 50,
    include: {
      message: { select: { body: true, author: true } },
      order: {
        select: {
          id: true,
          planName: true,
          buyerEmail: true,
          accessTokenHash: true,
        },
      },
    },
  });

  let sent = 0;

  for (const reminder of due) {
    const viewer = reminder.viewer as MessageViewer;
    const unreadCount = await getOrderUnreadCount(reminder.orderId, viewer);

    if (unreadCount === 0) {
      await db.orderMessageEmailReminder.update({
        where: { id: reminder.id },
        data: { canceledAt: now },
      });
      continue;
    }

    try {
      await sendNewMessageEmail({
        to: reminder.recipientEmail,
        planName: reminder.order.planName,
        orderId: reminder.orderId,
        messagePreview: reminder.message.body,
        recipientRole: viewer === "buyer" ? "buyer" : "support",
      });

      await db.orderMessageEmailReminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
      sent += 1;
    } catch (error) {
      logError(log, "send failed", error, { reminderId: reminder.id, orderId: reminder.orderId });
    }
  }

  return { processed: due.length, sent };
}
