import Link from "next/link";

import { SITE_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const legalLinks = [
  { href: "/about", label: "О сервисе" },
  { href: "/privacy", label: "Конфиденциальность" },
  { href: "/terms", label: "Условия" },
] as const;

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t border-border bg-background px-4 py-6", className)}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <span>
          © {new Date().getFullYear()} {SITE_NAME}
        </span>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
          {legalLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
