export type AdminStatsSnapshot = {
  usersCount: number;
  ordersCount: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  canceledOrdersCount: number;
  revenueTotal: number;
  activePlansCount: number;
};

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  ordersCount: number;
  paidTotal: number;
  rbacAdmin: boolean;
  rbacSupport: boolean;
  telegramUserId: string | null;
};

export type AdminUserDetailRecord = AdminUserRecord & {
  isCoreAdmin: boolean;
  telegramLinked: boolean;
};

export type AdminPaymentRecord = {
  id: string;
  status: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  yookassaId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type AdminPlanRecord = {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  provider: string;
  tierLabel: string;
  compareAtPrice: number | null;
  active: boolean;
  highlight: boolean;
  sortOrder: number;
};

export type AdminPlansProviderGroup = {
  id: string;
  label: string;
  description: string;
  active: boolean;
  plans: AdminPlanRecord[];
};

export type AdminPlanExportRow = AdminPlanRecord & {
  providerLabel: string;
  providerDescription: string;
  providerActive: boolean;
  tier: string;
  durationMonths: number;
  tag: string | null;
  badge: string | null;
  limits: string;
};

export type AdminLogEntry = {
  id: string;
  type: "user_registered" | "order_created" | "order_paid" | "order_canceled";
  message: string;
  detail: string | null;
  createdAt: string;
};

export type AdminCounterpartyPricingOptionRecord = {
  id: string;
  label: string;
  price: number;
  currency: string;
  notes: string;
  sortOrder: number;
  active: boolean;
};

export type AdminCounterpartyRecord = {
  id: string;
  name: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  wechatId: string;
  shopUrl: string;
  active: boolean;
  sortOrder: number;
  pricingOptionsCount: number;
};

export type AdminCounterpartyDetailRecord = Omit<AdminCounterpartyRecord, "pricingOptionsCount"> & {
  pricingOptions: AdminCounterpartyPricingOptionRecord[];
};

export type AdminCounterpartyExportRow = {
  counterpartyId: string;
  name: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  wechatId: string;
  shopUrl: string;
  counterpartyActive: boolean;
  counterpartySortOrder: number;
  createdAt: Date;
  optionId: string | null;
  optionLabel: string | null;
  optionPrice: number | null;
  optionCurrency: string | null;
  optionNotes: string | null;
  optionActive: boolean | null;
  optionSortOrder: number | null;
};
