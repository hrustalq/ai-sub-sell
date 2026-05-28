import { Skeleton } from "@/components/ui/skeleton";

export function PricingSectionSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8" aria-busy aria-label="Загрузка тарифов">
      <div className="mx-auto flex h-auto w-full max-w-2xl flex-wrap justify-center gap-1 rounded-lg bg-muted p-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-9 min-w-24 rounded-md" />
        ))}
      </div>
      <Skeleton className="mx-auto h-5 w-full max-w-md" />
      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-xs"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="mt-2 h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
