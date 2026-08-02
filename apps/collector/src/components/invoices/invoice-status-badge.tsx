"use client";

import { useTranslations } from "next-intl";
import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";
import {
  invoiceStatusMessageKey,
  invoiceStatusTone,
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
    <Stamp tone={invoiceStatusTone(status)} className={cn(className)}>
      {t(invoiceStatusMessageKey(status))}
    </Stamp>
  );
}
