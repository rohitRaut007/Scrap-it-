import type { CollectorProfile, Invoice } from "@/lib/types";
import type { InvoicePreviewInput } from "@/components/invoices/invoice-preview";

/** Builds the InvoicePreview's superset props from a persisted Invoice (+ the
 *  collector's profile for letterhead fields) — used to re-view an
 *  already-generated invoice at full size, not just re-download it blind. */
export function invoiceToPreviewInput(
  invoice: Invoice,
  profile?: CollectorProfile,
): InvoicePreviewInput {
  const base = {
    businessName: profile?.shopName || profile?.name || "",
    businessTagline: profile?.businessTagline ?? null,
    businessAddressText: profile?.shopAddressText ?? null,
    accentColor: profile?.accentColor ?? null,
    mobNo: profile?.phone ?? null,
    billingMonth: invoice.billingMonth,
    billingYear: invoice.billingYear,
    billNumber: invoice.billNumber,
    entityName: invoice.client.entityName,
    siteName: invoice.client.siteName,
    premisesType: invoice.client.premisesType,
    addressText: invoice.client.addressText,
    billToAddressText: invoice.client.billToAddressText,
    gstin: invoice.client.gstin,
    items: invoice.items,
    payableTo: invoice.payableTo,
  };
  if (invoice.billType === "RESIDENTIAL") {
    return { billType: "RESIDENTIAL", ...base };
  }
  return {
    billType: "COMMERCIAL",
    ...base,
    referencePoNumber: invoice.referencePoNumber,
    termsOfPayment: invoice.termsOfPayment,
    termsAndConditions: invoice.termsAndConditions,
  };
}
