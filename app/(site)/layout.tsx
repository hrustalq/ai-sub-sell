import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <SiteNavbar />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">{children}</div>
      <SiteFooter className="shrink-0" />
    </div>
  );
}
