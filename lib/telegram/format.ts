import { formatPrice } from "@/lib/plans/format";
import { ORDER_STATUS_LABELS } from "@/lib/orders/constants";

export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status;
}

export function formatOrderSummary(order: {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  buyerEmail: string;
}): string {
  return [
    `📦 <b>${escapeHtml(order.planName)}</b>`,
    `Сумма: ${formatPrice(order.amount, order.currency)}`,
    `Статус: ${formatOrderStatus(order.status)}`,
    `Email: ${escapeHtml(order.buyerEmail)}`,
    `ID: <code>${order.id}</code>`,
  ].join("\n");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
