export type UserOrderRecord = {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  confirmationUrl: string | null;
  createdAt: string;
  unreadCount: number;
};
