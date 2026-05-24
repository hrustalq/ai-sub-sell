import { ImageResponse } from "next/og";

import { BrandImage } from "@/components/seo/brand-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <BrandImage width={size.width} height={size.height} compact />,
    { ...size },
  );
}
