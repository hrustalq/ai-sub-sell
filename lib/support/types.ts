export type SupportOrderRecord = {
  id: string;
  orderNumber: string;
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
  orderNumber: string;
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

export type SupportConversationRecord = {
  id: string;
  status: string;
  buyerEmail: string | null;
  buyerTelegramUserId: string | null;
  buyerLabel: string;
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
  buyerTelegram: {
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  lastMessage: {
    id: string;
    author: string;
    body: string;
    createdAt: string;
  } | null;
};

export type SupportConversationDetailRecord = {
  id: string;
  status: string;
  buyerEmail: string | null;
  buyerTelegramUserId: string | null;
  buyerLabel: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  buyerTelegram: {
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

export type SupportConversationMessageRecord = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};
