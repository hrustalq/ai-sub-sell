import type { Metadata } from "next";

import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata();

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      {children}
    </main>
  );
}
