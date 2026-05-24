export type SupportOrderRecord = {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  unreadCount: number;
  needsReply: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  lastMessage: {
    id: string;
    author: string;
    body: string;
    createdAt: string;
  } | null;
};

export type SupportOrderDetailRecord = {
  id: string;
  status: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  productContent: string | null;
  confirmationUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};
