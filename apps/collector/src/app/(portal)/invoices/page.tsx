"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { InvoiceCard } from "@/components/invoices/invoice-card";
import { useInvoices } from "@/hooks/use-portal";

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <InvoicesContent />
    </Suspense>
  );
}

function InvoicesContent() {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = useInvoices(page);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("listTitle")}</h1>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            {t("newInvoice")}
          </Link>
        </Button>
      </div>

      {isLoading && !data ? (
        <InvoicesSkeleton />
      ) : error && !data ? (
        <ErrorState onRetry={() => mutate()} />
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <FileText className="mx-auto h-9 w-9 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mx-auto mt-1 max-w-60 text-xs text-muted-foreground">
            {t("emptyHint")}
          </p>
          <Button asChild size="sm" className="mt-4 gap-1.5">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4" />
              {t("newInvoice")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {tCommon("previous")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("pageOf", { page, total: Math.ceil(data.total / data.pageSize) })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.total / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
