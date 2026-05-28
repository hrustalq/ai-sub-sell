import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** When true, children fill remaining viewport height (for tables). */
  fill?: boolean;
  className?: string;
};

export function PageShell({
  title,
  description,
  actions,
  children,
  fill = false,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-4 overflow-hidden",
        fill && "h-full flex-1",
        className,
      )}
    >
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className={cn("min-h-0", fill ? "flex flex-1 flex-col" : undefined)}>
        {children}
      </div>
    </div>
  );
}
