import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger-script";

const log = createLogger("seed");

export const DEFAULT_ADMIN_EMAIL = "admin@example.com";
export const DEFAULT_ADMIN_PASSWORD = "admin12345";
export const DEFAULT_ADMIN_NAME = "Администратор";

export function getAdminSeedConfig() {
  const email = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? DEFAULT_ADMIN_NAME;

  return { email, password, name };
}

export async function seedAdminUser(db: PrismaClient): Promise<void> {
  const { email, password, name } = getAdminSeedConfig();
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

    log.info({ email }, "admin user updated");
    return;
  }

  const userId = crypto.randomUUID();

  await db.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
    },
  });

  await db.account.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashedPassword,
    },
  });

  log.info({ email }, "admin user created");
}
