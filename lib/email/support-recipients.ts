import "server-only";

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getSupportNotificationEmails(): string[] {
  const support = parseEmailList(process.env.SUPPORT_EMAILS ?? "");
  const admin = parseEmailList(process.env.ADMIN_EMAILS ?? "");
  const combined = [...new Set([...support, ...admin])];

  if (combined.length > 0) return combined;

  const fallback = process.env.SMTP_FROM_EMAIL?.trim().toLowerCase();
  return fallback ? [fallback] : [];
}
