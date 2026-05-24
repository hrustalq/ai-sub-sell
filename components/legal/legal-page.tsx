import { cn } from "@/lib/utils";

type LegalPageProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div
        className={cn(
          "flex flex-col gap-6 text-sm leading-relaxed text-foreground",
          "[&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold",
          "[&_h3]:mt-1 [&_h3]:text-sm [&_h3]:font-semibold",
          "[&_p]:text-muted-foreground",
          "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground",
          "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-muted-foreground",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        )}
      >
        {children}
      </div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
