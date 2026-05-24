import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/site-url";

const DISALLOW = [
  "/admin",
  "/api/",
  "/checkout",
  "/forgot-password",
  "/orders",
  "/profile",
  "/reset-password",
  "/sign-in",
  "/sign-up",
  "/support",
  "/user",
];

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
