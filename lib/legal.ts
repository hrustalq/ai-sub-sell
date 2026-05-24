import { SITE_DOMAIN, SITE_NAME } from "@/lib/brand";

/** Legal entity / seller details (required on the site for RF consumer law). */
export type LegalEntity = {
  /** Full name, e.g. «ИП Иванов Иван Иванович» */
  name: string;
  /** ИП or ООО */
  form: string;
  inn: string;
  /** ОГРН or ОГРНИП */
  ogrn: string;
  legalAddress: string;
  email: string;
  phone?: string;
};

function trim(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v || undefined;
}

/** Returns configured legal entity or null if required fields are missing. */
export function getLegalEntity(): LegalEntity | null {
  const name = trim(process.env.LEGAL_ENTITY_NAME);
  const inn = trim(process.env.LEGAL_INN);
  const ogrn = trim(process.env.LEGAL_OGRN);
  const legalAddress = trim(process.env.LEGAL_ADDRESS);
  const email = trim(process.env.LEGAL_EMAIL);

  if (!name || !inn || !ogrn || !legalAddress || !email) {
    return null;
  }

  return {
    name,
    form: trim(process.env.LEGAL_FORM) ?? "ИП",
    inn,
    ogrn,
    legalAddress,
    email,
    phone: trim(process.env.LEGAL_PHONE),
  };
}

export function getLegalEntityEmail(): string {
  return getLegalEntity()?.email ?? `support@${SITE_DOMAIN}`;
}

export const LEGAL_DOCUMENT_DATE = "24 мая 2026 г.";

export const LEGAL_OPERATOR_LABEL = `${SITE_NAME} (${SITE_DOMAIN})`;
