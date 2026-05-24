export function orderApiUrl(
  orderId: string,
  path: "" | "/messages" | "/messages/read" | "/fulfillment",
  accessToken: string | null,
): string {
  const query = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
  return `/api/orders/${orderId}${path}${query}`;
}
