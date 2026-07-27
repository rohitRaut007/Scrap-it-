"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { useLocale, useTranslations } from "next-intl";
import { numberToWordsInr } from "@scrap-it/constants";
import type { BillType } from "@scrap-it/constants";
import { ensureInvoiceFontsRegistered } from "@/lib/invoice-fonts";
import { formatBillDate, formatCommercialDate } from "@/lib/format";
import { buildResidentialBillMessages, buildCommercialInvoiceMessages } from "@/lib/invoice-messages";
import { monthMessageKey } from "@/lib/invoice-utils";
import { InvoiceDocument } from "@/components/invoices/invoice-document";

interface InvoicePreviewInputBase {
  businessName: string;
  businessTagline: string | null;
  accentColor: string | null;
  mobNo: string | null;
  billingMonth: number;
  billingYear: number;
  billNumber: string | null;
  entityName: string | null;
  siteName: string;
  premisesType: string | null;
  addressText: string | null;
  billToAddressText: string | null;
  gstin: string | null;
  items: { description: string; quantity: number; unit: string; rate: number }[];
  payableTo: string | null;
}

export type InvoicePreviewInput =
  | ({ billType: Extract<BillType, "RESIDENTIAL"> } & InvoicePreviewInputBase)
  | ({ billType: Extract<BillType, "COMMERCIAL"> } & InvoicePreviewInputBase & {
      referencePoNumber: string | null;
      termsOfPayment: string | null;
      termsAndConditions: string | null;
    });

/**
 * The live preview surface — renders the exact same template tree the final
 * PDF uses, via react-pdf's <PDFViewer> (an in-browser iframe renderer), so
 * there is structurally no drift between what's previewed and what gets
 * shared/downloaded. Which template is a function of `data.billType` alone.
 */
export function InvoicePreview({ data }: { data: InvoicePreviewInput }) {
  const locale = useLocale();
  const tMonth = useTranslations("invoice.month");
  const t = useTranslations("invoice");

  ensureInvoiceFontsRegistered();

  const items = data.items.map((i) => ({
    ...i,
    amount: Math.round(i.quantity * i.rate * 100) / 100,
  }));
  const total = Math.round(items.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
  const monthLabel = tMonth(monthMessageKey(data.billingMonth));

  return (
    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
      {data.billType === "RESIDENTIAL" ? (
        <InvoiceDocument
          billType="RESIDENTIAL"
          locale={locale}
          messages={buildResidentialBillMessages(t, monthLabel, data.billNumber)}
          accentColor={data.accentColor}
          businessName={data.businessName}
          businessTagline={data.businessTagline}
          mobNo={data.mobNo}
          dateText={formatBillDate(new Date())}
          entityName={data.entityName}
          siteName={data.siteName}
          premisesType={data.premisesType}
          addressText={data.addressText}
          billToAddressText={data.billToAddressText}
          gstin={data.gstin}
          items={items}
          total={total}
          amountInWords={numberToWordsInr(total)}
          payableTo={data.payableTo}
        />
      ) : (
        <InvoiceDocument
          billType="COMMERCIAL"
          locale={locale}
          messages={buildCommercialInvoiceMessages(t)}
          accentColor={data.accentColor}
          businessName={data.businessName}
          businessTagline={data.businessTagline}
          mobNo={data.mobNo}
          billNoText={data.billNumber ?? t("invoiceNoDraft")}
          dateText={formatCommercialDate(new Date())}
          billingPeriodText={`${monthLabel} ${data.billingYear}`}
          referencePoNumber={data.referencePoNumber}
          termsOfPayment={data.termsOfPayment}
          entityName={data.entityName}
          siteName={data.siteName}
          premisesType={data.premisesType}
          addressText={data.addressText}
          billToAddressText={data.billToAddressText}
          gstin={data.gstin}
          items={items}
          total={total}
          amountInWords={numberToWordsInr(total)}
          termsAndConditions={data.termsAndConditions}
        />
      )}
    </PDFViewer>
  );
}
