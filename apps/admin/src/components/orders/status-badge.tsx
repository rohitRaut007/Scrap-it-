import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusClasses, type OrderStatus } from "@/lib/order-utils";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "font-medium border-0",
        orderStatusClasses(status as OrderStatus),
      )}
    >
      {orderStatusLabel(status as OrderStatus)}
    </Badge>
  );
}
