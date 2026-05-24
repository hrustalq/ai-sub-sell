export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  CANCELED: "Отменён",
};

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS;
