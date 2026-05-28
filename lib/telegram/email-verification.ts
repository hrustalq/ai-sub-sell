import "server-only";

import { createElement } from "react";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import db from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { pageTitle } from "@/lib/brand";
import { isValidEmail } from "@/lib/orders/access";
import { normalizeEmail } from "@/lib/users/placeholder";
import { setTelegramAccountEmail } from "@/lib/telegram/accounts";
import { TelegramEmailCodeEmail } from "@/emails/telegram-email-code";
import { createLogger, logError } from "@/lib/logger";

const log = createLogger("telegram-email-verification");

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
export const TELEGRAM_EMAIL_CODE_LENGTH = 6;

function verificationSecret(): string {
  return (
    process.env.TELEGRAM_EMAIL_VERIFICATION_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    "telegram-email-verification-dev"
  );
}

function hashVerificationCode(
  code: string,
  telegramUserId: string,
  email: string,
): string {
  return createHash("sha256")
    .update(`${verificationSecret()}:${telegramUserId}:${email}:${code}`)
    .digest("hex");
}

function generateVerificationCode(): string {
  return String(randomInt(0, 10 ** TELEGRAM_EMAIL_CODE_LENGTH)).padStart(
    TELEGRAM_EMAIL_CODE_LENGTH,
    "0",
  );
}

function codesMatch(storedHash: string, candidateHash: string): boolean {
  try {
    return timingSafeEqual(
      Buffer.from(storedHash, "hex"),
      Buffer.from(candidateHash, "hex"),
    );
  } catch {
    return false;
  }
}

export async function requestTelegramEmailVerification(
  telegramUserId: string,
  email: string,
): Promise<
  | { ok: true; email: string; expiresInMinutes: number }
  | { ok: false; error: string; retryAfterSeconds?: number }
> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { ok: false, error: "Укажите корректный email" };
  }

  const existing = await db.telegramEmailVerification.findUnique({
    where: { telegramUserId },
  });

  if (existing) {
    const cooldownRemaining =
      RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime());
    if (cooldownRemaining > 0) {
      return {
        ok: false,
        error: "Подождите перед повторной отправкой кода",
        retryAfterSeconds: Math.ceil(cooldownRemaining / 1000),
      };
    }
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  const codeHash = hashVerificationCode(code, telegramUserId, normalized);

  await db.telegramEmailVerification.upsert({
    where: { telegramUserId },
    create: {
      telegramUserId,
      email: normalized,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
    update: {
      email: normalized,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  try {
    await sendEmail({
      to: normalized,
      subject: pageTitle("Код подтверждения Telegram"),
      template: createElement(TelegramEmailCodeEmail, {
        code,
        expiresMinutes: CODE_TTL_MS / 60_000,
      }),
    });
  } catch (err) {
    await db.telegramEmailVerification.deleteMany({ where: { telegramUserId } });
    logError(log, "failed to send telegram email verification", err, {
      telegramUserId,
    });
    return {
      ok: false,
      error: "Не удалось отправить письмо. Проверьте email и попробуйте позже",
    };
  }

  return {
    ok: true,
    email: normalized,
    expiresInMinutes: CODE_TTL_MS / 60_000,
  };
}

export async function confirmTelegramEmailVerification(
  telegramUserId: string,
  code: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false, error: "Введите 6-значный код из письма" };
  }

  const pending = await db.telegramEmailVerification.findUnique({
    where: { telegramUserId },
  });

  if (!pending) {
    return { ok: false, error: "Сначала запросите код: /email your@mail.com" };
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await db.telegramEmailVerification.deleteMany({ where: { telegramUserId } });
    return {
      ok: false,
      error: "Срок действия кода истёк. Запросите новый: /email your@mail.com",
    };
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await db.telegramEmailVerification.deleteMany({ where: { telegramUserId } });
    return {
      ok: false,
      error: "Слишком много попыток. Запросите новый код: /email your@mail.com",
    };
  }

  const candidateHash = hashVerificationCode(trimmed, telegramUserId, pending.email);
  if (!codesMatch(pending.codeHash, candidateHash)) {
    const attempts = pending.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.telegramEmailVerification.deleteMany({ where: { telegramUserId } });
      return {
        ok: false,
        error: "Слишком много попыток. Запросите новый код: /email your@mail.com",
      };
    }

    await db.telegramEmailVerification.update({
      where: { telegramUserId },
      data: { attempts },
    });

    return {
      ok: false,
      error: `Неверный код. Осталось попыток: ${MAX_ATTEMPTS - attempts}`,
    };
  }

  const linked = await setTelegramAccountEmail(telegramUserId, pending.email);
  if (!linked.ok) {
    return linked;
  }

  await db.telegramEmailVerification.deleteMany({ where: { telegramUserId } });

  return { ok: true, email: pending.email };
}

export async function clearTelegramEmailVerification(
  telegramUserId: string,
): Promise<void> {
  await db.telegramEmailVerification.deleteMany({ where: { telegramUserId } });
}
