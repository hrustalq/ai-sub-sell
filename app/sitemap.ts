import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
