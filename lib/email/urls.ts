export function getAppBaseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export function orderPageUrl(orderId: string, accessToken?: string | null): string {
  const base = getAppBaseUrl();
  const path = `/orders/${orderId}`;
  if (!accessToken) return `${base}${path}`;
  return `${base}${path}?token=${encodeURIComponent(accessToken)}`;
}

export function signInMagicLinkUrl(callbackUrl?: string): string {
  const base = getAppBaseUrl();
  if (!callbackUrl) return `${base}/sign-in`;
  return `${base}/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
