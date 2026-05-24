import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/orders/constants";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = ORDER_STATUS_LABELS[status] ?? status;

  return (
    <Badge
      variant="secondary"
      className={cn(
        status === "PAID" && "bg-primary/15 text-primary",
        status === "PENDING" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        status === "CANCELED" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
