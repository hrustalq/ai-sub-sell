import "server-only";

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getCoreAdminEmails(): string[] {
  return parseEmailList(process.env.CORE_ADMIN_EMAILS ?? "");
}

export function isCoreAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const coreAdmins = getCoreAdminEmails();
  if (coreAdmins.length === 0) return false;
  return coreAdmins.includes(email.trim().toLowerCase());
}
