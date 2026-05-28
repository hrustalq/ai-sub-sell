export type CounterpartyPricingOption = {
  id: string;
  counterpartyId: string;
  label: string;
  price: number;
  currency: string;
  notes: string;
  sortOrder: number;
  active: boolean;
};

export type Counterparty = {
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
  pricingOptions: CounterpartyPricingOption[];
};
