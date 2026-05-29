import "server-only";

import { randomInt } from "crypto";
import db from "@/lib/db";

/** Crockford-like alphabet without ambiguous 0/O, 1/I/L. */
const ORDER_NUMBER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SEGMENT_LENGTH = 4;

export function formatOrderNumber(raw: string): string {
  const normalized = normalizeOrderNumber(raw);
  if (normalized.length !== SEGMENT_LENGTH * 2) return raw.toUpperCase();
  return `${normalized.slice(0, SEGMENT_LENGTH)}-${normalized.slice(SEGMENT_LENGTH)}`;
}

export function normalizeOrderNumber(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Parse user/Telegram text into normalized 8-char order number, or null. */
export function parseOrderNumberFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("/")) return null;

  const normalized = normalizeOrderNumber(trimmed);
  if (normalized.length !== SEGMENT_LENGTH * 2) return null;
  if (!isValidOrderNumber(normalized)) return null;

  return normalized;
}

export function isValidOrderNumber(normalized: string): boolean {
  return (
    normalized.length === SEGMENT_LENGTH * 2 &&
    [...normalized].every((ch) => ORDER_NUMBER_ALPHABET.includes(ch))
  );
}

function randomSegment(): string {
  let segment = "";
  for (let i = 0; i < SEGMENT_LENGTH; i++) {
    segment += ORDER_NUMBER_ALPHABET[randomInt(0, ORDER_NUMBER_ALPHABET.length)]!;
  }
  return segment;
}

export function generateOrderNumberCandidate(): string {
  return `${randomSegment()}${randomSegment()}`;
}

export async function generateUniqueOrderNumber(maxAttempts = 12): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateOrderNumberCandidate();
    const taken = await db.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  throw new Error("Failed to generate unique order number");
}
