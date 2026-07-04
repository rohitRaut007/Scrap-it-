import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  orderStatusClasses,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/order-utils";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", orderStatusClasses(status), className)}
    >
      {orderStatusLabel(status)}
    </Badge>
  );
}
