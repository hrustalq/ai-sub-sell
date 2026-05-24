import { ImageResponse } from "next/og";

import { BrandImage } from "@/components/seo/brand-image";
import { SITE_NAME } from "@/lib/brand";

export const alt = `${SITE_NAME} — подписки на AI-инструменты для разработки`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<BrandImage width={size.width} height={size.height} />, {
    ...size,
  });
}
