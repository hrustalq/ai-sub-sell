import Link from "next/link";

import { cn } from "@/lib/utils";

type PageShellProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  /** When true, children fill remaining viewport height (for tables). */
  fill?: boolean;
  /** When true with fill, the content area scrolls vertically. */
  scroll?: boolean;
  className?: string;
};

export function PageShell({
  title,
  description,
  actions,
  backHref,
  backLabel = "← Назад",
  children,
  fill = false,
  scroll = false,
  className,
}: PageShellProps) {
  const hasHeader = Boolean(backHref || title || description || actions);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-4",
        fill && "h-full flex-1",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="mb-3 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {backLabel}
              </Link>
            )}
            {title && <h1>{title}</h1>}
            {description && (
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div
        className={cn(
          "min-h-0",
          fill && "flex min-h-0 flex-1 flex-col",
          scroll && "overflow-y-auto pb-1",
          !fill && "overflow-y-auto",
        )}
      >
        {children}
      </div>
    </div>
  );
}
