import type { Metadata } from "next";

import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = noIndexMetadata();

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/30">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
