import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();

  const staticPages = ["/", "/about", "/privacy", "/terms"] as const;

  return staticPages.map((path) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? ("daily" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.5,
  }));
}
