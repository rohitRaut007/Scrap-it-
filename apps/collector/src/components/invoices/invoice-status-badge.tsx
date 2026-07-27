"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  invoiceStatusClasses,
  invoiceStatusMessageKey,
} from "@/lib/invoice-utils";
import type { InvoiceStatus } from "@/lib/types";

export function InvoiceStatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  const t = useTranslations("invoice.status");
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", invoiceStatusClasses(status), className)}
    >
      {t(invoiceStatusMessageKey(status))}
    </Badge>
  );
}
