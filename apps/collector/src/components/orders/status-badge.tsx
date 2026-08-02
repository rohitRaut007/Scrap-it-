"use client";

import { useTranslations } from "next-intl";
import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";
import {
  orderStatusMessageKey,
  orderStatusTone,
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
    <Stamp tone={orderStatusTone(status)} className={cn(className)}>
      {t(orderStatusMessageKey(status))}
    </Stamp>
  );
}
