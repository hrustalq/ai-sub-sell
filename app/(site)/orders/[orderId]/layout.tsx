import type { Metadata } from "next";

import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata();

export default function OrderPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
