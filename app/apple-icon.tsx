import { ImageResponse } from "next/og";

import { BrandImage } from "@/components/seo/brand-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <BrandImage width={size.width} height={size.height} compact />,
    { ...size },
  );
}
