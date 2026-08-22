"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useLocale, useTranslations } from "next-intl";
import { Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ensureInvoiceFontsRegistered } from "@/lib/invoice-fonts";
import { buildResidentialBillMessages, buildCommercialInvoiceMessages } from "@/lib/invoice-messages";
import { monthMessageKey } from "@/lib/invoice-utils";
import { formatBillDate, formatCommercialDate, formatInr } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import type { CollectorProfile, Invoice } from "@/lib/types";

interface InvoiceShareButtonProps {
  invoice: Invoice;
  profile: CollectorProfile;
}

export function InvoiceShareButton({ invoice, profile }: InvoiceShareButtonProps) {
  const t = useTranslations("invoice");
  const tMonth = useTranslations("invoice.month");
  const locale = useLocale();
  const [generating, setGenerating] = useState(false);

  const monthLabel = tMonth(monthMessageKey(invoice.billingMonth));

  // Defensive: a missing client relation (soft-deleted / data edge case)
  // would otherwise throw inside buildDocument()/handleWhatsAppText below.
  if (!invoice.client) {
    return (
      <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        {t("shareUnavailable")}
      </p>
    );
  }

  const buildDocument = () => {
    const businessName = profile.shopName || profile.name || "";
    const accentColor = profile.accentColor;
    const mobNo = profile.phone;
    const businessAddressText = profile.shopAddressText;
    const { client } = invoice;

    if (invoice.billType === "RESIDENTIAL") {
      return (
        <InvoiceDocument
          billType="RESIDENTIAL"
          locale={locale}
          messages={buildResidentialBillMessages(t, monthLabel, invoice.billNumber)}
          accentColor={accentColor}
          businessName={businessName}
          businessTagline={profile.businessTagline}
          businessAddressText={businessAddressText}
          mobNo={mobNo}
          dateText={invoice.issuedAt ? formatBillDate(new Date(invoice.issuedAt)) : formatBillDate(new Date())}
          entityName={client.entityName}
          siteName={client.siteName}
          premisesType={client.premisesType}
          addressText={client.addressText}
          billToAddressText={client.billToAddressText}
          gstin={client.gstin}
          items={invoice.items}
          total={invoice.total}
          amountInWords={invoice.amountInWords ?? ""}
          payableTo={invoice.payableTo}
        />
      );
    }

    return (
      <InvoiceDocument
        billType="COMMERCIAL"
        locale={locale}
        messages={buildCommercialInvoiceMessages(t)}
        accentColor={accentColor}
        businessName={businessName}
        businessTagline={profile.businessTagline}
        businessAddressText={businessAddressText}
        mobNo={mobNo}
        billNoText={invoice.billNumber ?? t("invoiceNoDraft")}
        dateText={
          invoice.issuedAt
            ? formatCommercialDate(new Date(invoice.issuedAt))
            : formatCommercialDate(new Date())
        }
        billingPeriodText={`${monthLabel} ${invoice.billingYear}`}
        referencePoNumber={invoice.referencePoNumber}
        termsOfPayment={invoice.termsOfPayment}
        entityName={client.entityName}
        siteName={client.siteName}
        premisesType={client.premisesType}
        addressText={client.addressText}
        billToAddressText={client.billToAddressText}
        gstin={client.gstin}
        items={invoice.items}
        total={invoice.total}
        amountInWords={invoice.amountInWords ?? ""}
        termsAndConditions={invoice.termsAndConditions}
      />
    );
  };

  const handleDownloadOrShare = async () => {
    setGenerating(true);
    try {
      ensureInvoiceFontsRegistered();
      const blob = await pdf(buildDocument()).toBlob();

      const fileName = `${invoice.billNumber ?? invoice.id}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("shareTitle"),
          text: t("shareText", { site: invoice.client.siteName, month: monthLabel }),
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user cancelled the native share sheet — not an error
      } else {
        console.error("Failed to generate/share invoice PDF:", err);
        toast.error(t("toastError"));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleWhatsAppText = () => {
    const text = t("whatsappText", {
      site: invoice.client.siteName,
      month: monthLabel,
      amount: formatInr(invoice.total),
    });
    window.open(buildWhatsAppUrl(undefined, text), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button variant="outline" className="gap-2" onClick={handleWhatsAppText}>
        <MessageCircle className="h-4 w-4" />
        {t("shareWhatsApp")}
      </Button>
      <Button className="gap-2" onClick={handleDownloadOrShare} disabled={generating}>
        <Download className="h-4 w-4" />
        {generating ? t("generating") : t("downloadOrShare")}
      </Button>
    </div>
  );
}
