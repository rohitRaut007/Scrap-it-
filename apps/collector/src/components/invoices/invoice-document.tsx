import type { BillType } from "@scrap-it/constants";
import {
  ResidentialBillDocument,
  type ResidentialBillDocumentProps,
} from "./residential-bill-document";
import {
  CommercialInvoiceDocument,
  type CommercialInvoiceDocumentProps,
} from "./commercial-invoice-document";

export type {
  ResidentialBillDocumentProps,
  ResidentialBillMessages,
  InvoiceLineItem,
} from "./residential-bill-document";
export type {
  CommercialInvoiceDocumentProps,
  CommercialInvoiceMessages,
} from "./commercial-invoice-document";
export { ResidentialBillDocument } from "./residential-bill-document";
export { CommercialInvoiceDocument } from "./commercial-invoice-document";

export type InvoiceDocumentProps =
  | ({ billType: Extract<BillType, "RESIDENTIAL"> } & ResidentialBillDocumentProps)
  | ({ billType: Extract<BillType, "COMMERCIAL"> } & CommercialInvoiceDocumentProps);

/** Thin switch between the two bill templates, keyed on billType. */
export function InvoiceDocument(props: InvoiceDocumentProps) {
  const { billType, ...rest } = props;
  if (billType === "RESIDENTIAL") {
    return <ResidentialBillDocument {...(rest as ResidentialBillDocumentProps)} />;
  }
  return <CommercialInvoiceDocument {...(rest as CommercialInvoiceDocumentProps)} />;
}
