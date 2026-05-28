import { createHash } from "crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger-script";

const log = createLogger("seed");

export const SEED_ORDER_IDS = {
  needsReply: "seed-order-needs-reply",
  unreadBuyer: "seed-order-unread-buyer",
  allRead: "seed-order-all-read",
  pending: "seed-order-pending",
  canceled: "seed-order-canceled",
  guest: "seed-order-guest",
} as const;

export const SEED_GUEST_ACCESS_TOKEN = "seed-guest-order-token-dev-only";

/** Dev-only magic-link tokens (also work without login). */
export const SEED_ORDER_ACCESS_TOKENS: Record<
  (typeof SEED_ORDER_IDS)[keyof typeof SEED_ORDER_IDS],
  string
> = {
  [SEED_ORDER_IDS.needsReply]: "seed-token-needs-reply",
  [SEED_ORDER_IDS.unreadBuyer]: "seed-token-unread-buyer",
  [SEED_ORDER_IDS.allRead]: "seed-token-all-read",
  [SEED_ORDER_IDS.pending]: "seed-token-pending",
  [SEED_ORDER_IDS.canceled]: "seed-token-canceled",
  [SEED_ORDER_IDS.guest]: SEED_GUEST_ACCESS_TOKEN,
};

export function seedOrderUrl(
  baseUrl: string,
  orderId: string,
  token?: string,
): string {
  const path = `/orders/${orderId}`;
  return token ? `${baseUrl}${path}?token=${encodeURIComponent(token)}` : `${baseUrl}${path}`;
}

export const DEFAULT_BUYER_EMAIL = "buyer@example.com";
export const DEFAULT_BUYER_PASSWORD = "buyer12345";
export const DEFAULT_BUYER_NAME = "Тестовый покупатель";

const SEED_BUYER_ID = "00000000-0000-4000-8000-000000000001";

function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function getBuyerSeedConfig() {
  return {
    email: (process.env.SEED_BUYER_EMAIL ?? DEFAULT_BUYER_EMAIL).trim().toLowerCase(),
    password: process.env.SEED_BUYER_PASSWORD ?? DEFAULT_BUYER_PASSWORD,
    name: process.env.SEED_BUYER_NAME ?? DEFAULT_BUYER_NAME,
  };
}

async function seedBuyerUser(db: PrismaClient): Promise<string> {
  const { email, password, name } = getBuyerSeedConfig();
  const hashedPassword = await hashPassword(password);

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    const account = await db.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    if (account) {
      await db.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
    } else {
      await db.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: existing.id,
          providerId: "credential",
          accountId: existing.id,
          password: hashedPassword,
        },
      });
    }

    await db.user.update({
      where: { id: existing.id },
      data: { name, emailVerified: true },
    });

    return existing.id;
  }

  await db.user.create({
    data: {
      id: SEED_BUYER_ID,
      name,
      email,
      emailVerified: true,
    },
  });

  await db.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: SEED_BUYER_ID,
      providerId: "credential",
      accountId: SEED_BUYER_ID,
      password: hashedPassword,
    },
  });

  return SEED_BUYER_ID;
}

async function clearSeedOrders(db: PrismaClient) {
  const orderIds = Object.values(SEED_ORDER_IDS);

  await db.orderMessageRead.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.orderMessage.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.order.deleteMany({ where: { id: { in: orderIds } } });
}

export async function seedDemoOrders(db: PrismaClient): Promise<void> {
  const plan = await db.plan.findFirst({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, currency: true },
  });

  if (!plan) {
    log.info("skipping demo orders seed: no active plans");
    return;
  }

  const buyerId = await seedBuyerUser(db);
  const buyerEmail = getBuyerSeedConfig().email;

  await clearSeedOrders(db);

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  await db.order.createMany({
    data: [
      {
        id: SEED_ORDER_IDS.needsReply,
        userId: buyerId,
        buyerEmail,
        accessTokenHash: hashAccessToken(SEED_ORDER_ACCESS_TOKENS[SEED_ORDER_IDS.needsReply]),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        status: "PAID",
        productContent: null,
        createdAt: hoursAgo(48),
        updatedAt: hoursAgo(1),
      },
      {
        id: SEED_ORDER_IDS.unreadBuyer,
        userId: buyerId,
        buyerEmail,
        accessTokenHash: hashAccessToken(SEED_ORDER_ACCESS_TOKENS[SEED_ORDER_IDS.unreadBuyer]),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        status: "PAID",
        productContent: "login: demo@seed.local\npassword: seed-demo-pass",
        createdAt: hoursAgo(72),
        updatedAt: hoursAgo(2),
      },
      {
        id: SEED_ORDER_IDS.allRead,
        userId: buyerId,
        buyerEmail,
        accessTokenHash: hashAccessToken(SEED_ORDER_ACCESS_TOKENS[SEED_ORDER_IDS.allRead]),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        status: "PAID",
        productContent: "Всё выдано, переписка прочитана с обеих сторон.",
        createdAt: hoursAgo(96),
        updatedAt: hoursAgo(24),
      },
      {
        id: SEED_ORDER_IDS.pending,
        userId: buyerId,
        buyerEmail,
        accessTokenHash: hashAccessToken(SEED_ORDER_ACCESS_TOKENS[SEED_ORDER_IDS.pending]),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        status: "PENDING",
        confirmationUrl: "https://yookassa.ru/demo-payment",
        createdAt: hoursAgo(3),
        updatedAt: hoursAgo(3),
      },
      {
        id: SEED_ORDER_IDS.canceled,
        userId: buyerId,
        buyerEmail,
        accessTokenHash: hashAccessToken(SEED_ORDER_ACCESS_TOKENS[SEED_ORDER_IDS.canceled]),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        status: "CANCELED",
        createdAt: hoursAgo(12),
        updatedAt: hoursAgo(10),
      },
      {
        id: SEED_ORDER_IDS.guest,
        userId: null,
        buyerEmail: "guest-buyer@example.com",
        accessTokenHash: hashAccessToken(SEED_GUEST_ACCESS_TOKEN),
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        status: "PAID",
        productContent: null,
        createdAt: hoursAgo(36),
        updatedAt: hoursAgo(4),
      },
    ],
  });

  await db.orderMessage.createMany({
    data: [
      {
        id: "seed-msg-001",
        orderId: SEED_ORDER_IDS.needsReply,
        author: "seller",
        body: "Спасибо за оплату! Мы подготовим данные доступа и разместим их на этой странице.",
        createdAt: hoursAgo(47),
      },
      {
        id: "seed-msg-002",
        orderId: SEED_ORDER_IDS.needsReply,
        author: "buyer",
        body: "Здравствуйте! Когда будут готовы данные для входа?",
        createdAt: hoursAgo(1),
      },
      {
        id: "seed-msg-003",
        orderId: SEED_ORDER_IDS.unreadBuyer,
        author: "seller",
        body: "Данные доступа готовы — проверьте блок «Купленный товар» на странице заказа.",
        createdAt: hoursAgo(2),
      },
      {
        id: "seed-msg-004",
        orderId: SEED_ORDER_IDS.allRead,
        author: "seller",
        body: "Оплата получена, доступ выдан.",
        createdAt: hoursAgo(48),
      },
      {
        id: "seed-msg-005",
        orderId: SEED_ORDER_IDS.allRead,
        author: "buyer",
        body: "Спасибо, всё работает!",
        createdAt: hoursAgo(25),
      },
      {
        id: "seed-msg-006",
        orderId: SEED_ORDER_IDS.allRead,
        author: "seller",
        body: "Рады помочь. Обращайтесь, если понадобится продление.",
        createdAt: hoursAgo(24),
      },
      {
        id: "seed-msg-007",
        orderId: SEED_ORDER_IDS.guest,
        author: "seller",
        body: "Спасибо за покупку! Напишите, если нужна помощь с активацией.",
        createdAt: hoursAgo(35),
      },
      {
        id: "seed-msg-008",
        orderId: SEED_ORDER_IDS.guest,
        author: "buyer",
        body: "Не вижу данные доступа — подскажите, где их искать?",
        createdAt: hoursAgo(4),
      },
    ],
  });

  await db.orderMessageRead.createMany({
    data: [
      {
        orderId: SEED_ORDER_IDS.needsReply,
        viewer: "seller",
        readAt: hoursAgo(46),
      },
      {
        orderId: SEED_ORDER_IDS.needsReply,
        viewer: "buyer",
        readAt: hoursAgo(1),
      },
      {
        orderId: SEED_ORDER_IDS.unreadBuyer,
        viewer: "seller",
        readAt: hoursAgo(2),
      },
      {
        orderId: SEED_ORDER_IDS.allRead,
        viewer: "seller",
        readAt: hoursAgo(23),
      },
      {
        orderId: SEED_ORDER_IDS.allRead,
        viewer: "buyer",
        readAt: hoursAgo(23),
      },
      {
        orderId: SEED_ORDER_IDS.guest,
        viewer: "seller",
        readAt: hoursAgo(34),
      },
    ],
  });

  const guestLinks = Object.fromEntries(
    Object.values(SEED_ORDER_IDS).map((orderId) => [
      orderId,
      seedOrderUrl(baseUrl, orderId, SEED_ORDER_ACCESS_TOKENS[orderId]),
    ]),
  );

  log.info(
    {
      buyerEmail,
      supportUrl: `${baseUrl}/support`,
      needsReplyUrl: `${baseUrl}/support/${SEED_ORDER_IDS.needsReply}`,
      guestOrderLinks: guestLinks,
    },
    "demo orders seeded",
  );
}
