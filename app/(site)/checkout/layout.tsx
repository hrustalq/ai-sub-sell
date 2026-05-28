import type { Metadata } from "next";

import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata();

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-var(--layout-site-header-height))] flex-col">
      {children}
    </div>
  );
}
