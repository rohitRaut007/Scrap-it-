"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  orderStatusClasses,
  orderStatusMessageKey,
  type OrderStatus,
} from "@/lib/order-utils";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const t = useTranslations("orders.status");
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", orderStatusClasses(status), className)}
    >
      {t(orderStatusMessageKey(status))}
    </Badge>
  );
}
