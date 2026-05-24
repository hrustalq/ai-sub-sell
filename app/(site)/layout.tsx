import { SiteNavbar } from "@/components/layout/site-navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNavbar />
      {children}
    </>
  );
}
