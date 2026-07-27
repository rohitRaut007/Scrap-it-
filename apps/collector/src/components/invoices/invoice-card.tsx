"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, ChevronRight } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { formatInr } from "@/lib/format";
import { monthMessageKey } from "@/lib/invoice-utils";
import type { Invoice } from "@/lib/types";

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const t = useTranslations("invoice");
  const tMonth = useTranslations("invoice.month");

  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className="block rounded-2xl border bg-card p-4 shadow-xs transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          {invoice.client.entityName || invoice.client.siteName}
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {tMonth(monthMessageKey(invoice.billingMonth))} {invoice.billingYear}
          {invoice.billNumber != null && ` · ${t("invoiceNoShort", { number: invoice.billNumber })}`}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-cash">
            {formatInr(invoice.total)}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </Link>
  );
}
