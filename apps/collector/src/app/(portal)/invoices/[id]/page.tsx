"use client";

import { use, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Separator } from "@/components/ui/separator";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";

// @react-pdf/renderer is heavy — keep it out of this page's initial bundle
// and only load it once the collector actually wants to view/download/share.
const InvoiceShareButton = dynamic(
  () =>
    import("@/components/invoices/invoice-share-button").then(
      (m) => m.InvoiceShareButton,
    ),
  { ssr: false },
);
const InvoicePreview = dynamic(
  () => import("@/components/invoices/invoice-preview").then((m) => m.InvoicePreview),
  { ssr: false, loading: () => <Skeleton className="h-full rounded-xl" /> },
);

import { useInvoice, useProfile } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import { formatInr } from "@/lib/format";
import { monthMessageKey } from "@/lib/invoice-utils";
import { invoiceToPreviewInput } from "@/lib/invoice-preview-input";
import { revalidateCollectorData } from "@/lib/revalidate";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("invoice");
  const tMonth = useTranslations("invoice.month");
  const { data: invoice, isLoading, error, mutate } = useInvoice(id);
  const { data: profile } = useProfile();
  const [busy, setBusy] = useState(false);

  const runStatusUpdate = async (status: "PAID" | "OVERDUE") => {
    setBusy(true);
    try {
      await collectorApi.updateInvoiceStatus(id, status);
      await mutate();
      await revalidateCollectorData("invoices");
      toast.success(t("toastStatusUpdated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading && !invoice) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if ((error || !invoice) && !isLoading) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState onRetry={() => mutate()} />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-4">
      <BackLink />

      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4.5 w-4.5 text-primary shrink-0" />
            {invoice.client.entityName || invoice.client.siteName}
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" />
          {tMonth(monthMessageKey(invoice.billingMonth))} {invoice.billingYear}
          {invoice.billNumber != null && ` · ${t("invoiceNoShort", { number: invoice.billNumber })}`}
        </div>
        <p className="mt-3 font-mono text-2xl font-bold text-cash">
          {formatInr(invoice.total)}
        </p>
        {invoice.amountInWords && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("amountInWordsPrefix")} {invoice.amountInWords} {t("amountInWordsSuffix")}
          </p>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <h2 className="text-sm font-semibold">{t("itemsSectionTitle")}</h2>
        <div className="mt-3 space-y-2.5">
          {invoice.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} {item.unit} × {formatInr(item.rate)}
                </p>
              </div>
              <span className="shrink-0 font-mono font-medium">
                {formatInr(item.amount)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{t("totalLabel")}</span>
          <span className="font-mono">{formatInr(invoice.total)}</span>
        </div>
      </div>

      <div className="h-[70vh] min-h-[480px] w-full overflow-hidden rounded-xl border">
        <InvoicePreview data={invoiceToPreviewInput(invoice, profile)} />
      </div>

      {profile && <InvoiceShareButton invoice={invoice} profile={profile} />}

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => router.push(`/invoices/new?cloneFrom=${invoice.id}`)}
      >
        <RefreshCw className="h-4 w-4" />
        {t("generateNextMonth")}
      </Button>

      {invoice.status === "SENT" && (
        <Button
          variant="outline"
          className="w-full gap-2 text-cash"
          onClick={() => runStatusUpdate("PAID")}
          disabled={busy}
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("markPaid")}
        </Button>
      )}
      {invoice.status === "OVERDUE" && (
        <Button
          variant="outline"
          className="w-full gap-2 text-cash"
          onClick={() => runStatusUpdate("PAID")}
          disabled={busy}
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("markPaid")}
        </Button>
      )}
      {invoice.status === "PAID" && (
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive"
          onClick={() => runStatusUpdate("OVERDUE")}
          disabled={busy}
        >
          {t("markOverdue")}
        </Button>
      )}
    </div>
  );
}

function BackLink() {
  const t = useTranslations("invoice");
  return (
    <Link
      href="/invoices"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("backToInvoices")}
    </Link>
  );
}
