import type { Metadata } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";

export const SITE_LOCALE = "ru_RU";

export const SITE_KEYWORDS = [
  process.env.SITE_NAME ?? "",
  "подписка Codex",
  "подписка Cursor",
  "подписка Claude",
  "AI для разработки",
  "OpenAI Codex",
];

export const NO_INDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export function noIndexMetadata(overrides?: Metadata): Metadata {
  return {
    robots: NO_INDEX_ROBOTS,
    ...overrides,
  };
}

export function createRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const verification: Metadata["verification"] = {};

  if (process.env.GOOGLE_SITE_VERIFICATION?.trim()) {
    verification.google = process.env.GOOGLE_SITE_VERIFICATION.trim();
  }
  if (process.env.YANDEX_VERIFICATION?.trim()) {
    verification.yandex = process.env.YANDEX_VERIFICATION.trim();
  }

  return {
    metadataBase: siteUrl,
    title: {
      default: SITE_TITLE,
      template: `%s — ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_NAME, url: siteUrl.origin }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: siteUrl.origin,
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}
