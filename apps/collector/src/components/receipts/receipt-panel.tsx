"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/use-portal";
import { collectorApi, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ensureReceiptFontsRegistered } from "@/lib/receipt-fonts";
import { ReceiptDocument } from "@/components/receipts/receipt-document";
import type { CollectorOrder } from "@/lib/types";

interface ReceiptPanelProps {
  order: CollectorOrder;
  onReceiptNumberAssigned: (receiptNumber: number) => void;
  /** Fired after a successful generate + share/download. */
  onGenerated?: () => void;
  onGeneratingChange?: (generating: boolean) => void;
}

/** Business-details toggle + Generate & Share button — the actual receipt
 * generation logic, decoupled from any Dialog chrome so it can be embedded
 * both in PrintReceiptDialog and inline in another flow's success step. */
export function ReceiptPanel({
  order,
  onReceiptNumberAssigned,
  onGenerated,
  onGeneratingChange,
}: ReceiptPanelProps) {
  const t = useTranslations("receipt");
  const locale = useLocale();
  const { data: profile } = useProfile();
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (profile) setShowBusinessDetails(profile.showBusinessDetailsOnReceipt);
  }, [profile]);

  const setGeneratingState = (value: boolean) => {
    setGenerating(value);
    onGeneratingChange?.(value);
  };

  const handleGenerate = async () => {
    if (!profile) return;
    setGeneratingState(true);
    try {
      const { receiptNumber } =
        order.source === "manual"
          ? await collectorApi.logReceiptNumber(order.id)
          : await collectorApi.orderReceiptNumber(order.id);
      onReceiptNumberAssigned(receiptNumber);

      ensureReceiptFontsRegistered();
      const business = showBusinessDetails
        ? {
            shopName: profile.shopName,
            shopAddressText: profile.shopAddressText,
            gstNumber: profile.gstNumber,
          }
        : null;

      const blob = await pdf(
        <ReceiptDocument
          locale={locale}
          messages={{
            docTitle: t("docTitle"),
            receiptNoLabel: t("receiptNoLabel", { number: receiptNumber }),
            dateLabel: t("dateLabel"),
            customerLabel: t("customerLabel"),
            itemsHeader: t("itemsHeader"),
            weightLabel: t("weightLabel"),
            rateLabel: t("rateLabel"),
            amountLabel: t("amountLabel"),
            totalLabel: t("totalLabel"),
            poweredBy: t("poweredBy"),
          }}
          dateText={formatDate(order.scheduledAt)}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          items={order.categories.map((c) => ({
            name: c.name,
            weightKg: c.weightKg,
            rateInrPerKg: c.rateInrPerKg,
            amountInr: c.payoutInr,
          }))}
          totalInr={order.payoutInr}
          business={business}
        />,
      ).toBlob();

      const fileName = `receipt-${receiptNumber}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("shareTitle"),
          text: t("shareText"),
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      onGenerated?.();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user cancelled the native share sheet — not an error
      } else {
        toast.error(err instanceof ApiError ? err.message : t("toastError"));
      }
    } finally {
      setGeneratingState(false);
    }
  };

  return (
    <div className="space-y-4">
      {profile?.hasBusinessDetails && (
        <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
          <div className="min-w-0">
            <Label htmlFor="show-business-details">
              {t("showBusinessDetailsLabel")}
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("showBusinessDetailsHint")}
            </p>
          </div>
          <Switch
            id="show-business-details"
            checked={showBusinessDetails}
            onCheckedChange={setShowBusinessDetails}
            disabled={generating}
          />
        </div>
      )}

      <Button
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={generating || !profile}
      >
        <Download className="h-4 w-4" />
        {generating ? t("generating") : t("generateButton")}
      </Button>
    </div>
  );
}
