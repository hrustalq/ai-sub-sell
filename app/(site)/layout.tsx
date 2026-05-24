import { SiteNavbar } from "@/components/layout/site-navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNavbar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
