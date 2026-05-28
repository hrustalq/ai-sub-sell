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
        <h1>{title}</h1>
        {description && (
          <p className="mt-2 text-lead text-muted-foreground">{description}</p>
        )}
      </header>
      <div
        className={cn(
          "text-prose flex flex-col gap-6 text-base leading-relaxed text-foreground",
          "[&_h2]:mt-4 [&_h2]:text-h4 [&_h2]:font-semibold",
          "[&_h3]:mt-2 [&_h3]:text-h4 [&_h3]:font-semibold",
          "[&_p]:max-w-none [&_p]:text-muted-foreground",
          "[&_p+p]:mt-4",
          "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-muted-foreground",
          "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:text-muted-foreground",
          "[&_li]:leading-relaxed",
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
