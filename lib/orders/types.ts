export type OrderRecord = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  buyerEmail: string;
  productContent: string | null;
  confirmationUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderMessageRecord = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type OrderMessagesResponse = {
  messages: OrderMessageRecord[];
  unreadCount: number;
};

export type OrderUnreadSummaryResponse = {
  totalUnread: number;
  orders: { orderId: string; unreadCount: number }[];
};

export type OrderDetailResponse = {
  order: OrderRecord;
  access: {
    canManageFulfillment: boolean;
    authorRole: "buyer" | "seller";
  };
};
