/** Canonical public origin for metadata, sitemap, and JSON-LD. */
export function getSiteUrl(): URL {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ||
    "http://localhost:3000";

  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return new URL(normalized);
}

export function getSiteOrigin(): string {
  return getSiteUrl().origin;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, getSiteUrl()).href;
}
