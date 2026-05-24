import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-url";

export function buildHomeJsonLd() {
  const origin = getSiteOrigin();

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: origin,
      description: SITE_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: origin,
      description: SITE_DESCRIPTION,
      inLanguage: "ru-RU",
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: origin,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: origin,
      },
      inLanguage: "ru-RU",
    },
  ];
}
