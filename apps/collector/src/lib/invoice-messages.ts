import type { ResidentialBillMessages } from "@/components/invoices/residential-bill-document";
import type { CommercialInvoiceMessages } from "@/components/invoices/commercial-invoice-document";

type Translator = (key: string, values?: Record<string, string | number>) => string;

/** Resolves every static/templated string ResidentialBillDocument needs, once,
 *  from the `invoice` i18n namespace — shared by the live preview and the
 *  final share/download flow so both ever build the exact same props. */
export function buildResidentialBillMessages(
  t: Translator,
  monthLabel: string,
  billNumber: string | null,
): ResidentialBillMessages {
  return {
    billOfTitle: t("billOfTitle", { month: monthLabel }),
    billNoText:
      billNumber != null
        ? t("billNoText", { number: billNumber })
        : t("invoiceNoDraft"),
    mobNoLabel: t("mobNoLabel"),
    dateLabel: t("dateLabel"),
    billToLabel: t("billToLabel"),
    shipToLabel: t("shipToLabel"),
    clientGstinLabel: t("clientGstinLabel"),
    srNoHeader: t("srNoHeader"),
    descriptionHeader: t("descriptionHeader"),
    qtyHeader: t("qtyHeader"),
    rateHeader: t("rateHeader"),
    amountHeader: t("amountHeader"),
    totalLabel: t("totalLabel"),
    amountInWordsPrefix: t("amountInWordsPrefix"),
    amountInWordsSuffix: t("amountInWordsSuffix"),
    checkPaymentNameLabel: t("checkPaymentNameLabel"),
    forLabel: t("forLabel"),
    authorizedSignatoryLabel: t("authorizedSignatoryLabel"),
  };
}

/** Same pattern as buildResidentialBillMessages, for the Commercial Invoice template.
 *  Unlike the residential template, the formatted bill number is passed as a
 *  direct `billNoText` prop on the document rather than baked into messages. */
export function buildCommercialInvoiceMessages(t: Translator): CommercialInvoiceMessages {
  return {
    invoiceTitle: t("invoiceTitle"),
    invoiceNoDocLabel: t("invoiceNoDocLabel"),
    invoiceDateLabel: t("invoiceDateLabel"),
    billingPeriodLabel: t("billingPeriodLabel"),
    referencePoDocLabel: t("referencePoDocLabel"),
    termsOfPaymentDocLabel: t("termsOfPaymentDocLabel"),
    mobNoLabel: t("mobNoLabel"),
    billToLabel: t("billToLabel"),
    shipToLabel: t("shipToLabel"),
    clientGstinLabel: t("clientGstinLabel"),
    slNoHeader: t("slNoHeader"),
    descriptionOfServicesHeader: t("descriptionOfServicesHeader"),
    periodHeader: t("periodHeader"),
    rateHeader: t("rateHeader"),
    perHeader: t("perHeader"),
    amountHeader: t("amountHeader"),
    totalLabel: t("totalLabel"),
    amountInWordsLabelCommercial: t("amountInWordsLabelCommercial"),
    termsAndConditionsHeading: t("termsAndConditionsHeading"),
    forLabel: t("forLabel"),
    authorizedSignatoryLabel: t("authorizedSignatoryLabel"),
    noReferencePlaceholder: t("noReferencePlaceholder"),
  };
}
