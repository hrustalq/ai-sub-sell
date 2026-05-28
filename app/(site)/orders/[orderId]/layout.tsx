import { cn } from "@/lib/utils";

export default function OrderPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        "max-lg:overflow-y-auto",
        "lg:h-[calc(100dvh-var(--layout-site-header-height))] lg:max-h-[calc(100dvh-var(--layout-site-header-height))] lg:overflow-hidden",
      )}
    >
      {children}
    </div>
  );
}
