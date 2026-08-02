import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "@scrap-it/design-tokens";
import { invoiceBodyFontFamily } from "@/lib/invoice-fonts";
import {
  sharedStyles,
  formatAmount,
  formatQuantity,
  formatRate,
  SectionLabel,
  HeaderBand,
  SignatureBlock,
} from "./invoice-document-shared";
import type { InvoiceLineItem } from "./residential-bill-document";

export interface CommercialInvoiceMessages {
  invoiceTitle: string; // "INVOICE"
  invoiceNoDocLabel: string; // "Invoice No."
  invoiceDateLabel: string; // "Invoice Date"
  billingPeriodLabel: string; // "Billing Period"
  referencePoDocLabel: string; // "Reference / PO No."
  termsOfPaymentDocLabel: string; // "Terms of Payment"
  mobNoLabel: string;
  billToLabel: string;
  shipToLabel: string;
  clientGstinLabel: string;
  slNoHeader: string;
  descriptionOfServicesHeader: string;
  qtyHeader: string;
  rateHeader: string;
  perHeader: string;
  amountHeader: string;
  totalLabel: string;
  amountInWordsLabelCommercial: string; // "Amount in Words :"
  termsAndConditionsHeading: string;
  forLabel: string;
  authorizedSignatoryLabel: string;
  noReferencePlaceholder: string; // "—"
}

export interface CommercialInvoiceDocumentProps {
  locale: string;
  messages: CommercialInvoiceMessages;
  accentColor?: string | null;
  businessName: string;
  businessTagline: string | null;
  mobNo: string | null;
  billNoText: string; // e.g. "COM-016" or draft placeholder
  dateText: string;
  billingPeriodText: string; // e.g. "June 2026"
  referencePoNumber: string | null;
  termsOfPayment: string | null;
  entityName: string | null;
  siteName: string;
  premisesType: string | null;
  addressText: string | null;
  billToAddressText: string | null;
  gstin: string | null;
  items: InvoiceLineItem[];
  total: number;
  amountInWords: string;
  termsAndConditions: string | null;
}

const styles = StyleSheet.create({
  titleBlock: { marginTop: 6, alignItems: "center" },
  invoiceTitle: {
    fontSize: 18,
    textDecoration: "underline",
    fontWeight: "bold",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    flexWrap: "wrap",
  },
  metaText: { fontSize: 9.5 },
  metaBold: { fontWeight: "bold" },
  colSlNo: { width: "7%" },
  colDescription: { width: "35%" },
  colQty: { width: "14%" },
  colRate: { width: "14%" },
  colPer: { width: "12%" },
  colAmount: { width: "18%" },
  amountInWords: { marginTop: 16, fontSize: 10.5 },
  termsBlock: { marginTop: 14 },
  termsHeading: { fontSize: 10, fontWeight: "bold", marginBottom: 3 },
  termsLine: { fontSize: 9, marginTop: 1.5, color: colors.inkSoft },
});

export function CommercialInvoiceDocument({
  locale,
  messages: m,
  accentColor,
  businessName,
  businessTagline,
  mobNo,
  billNoText,
  dateText,
  billingPeriodText,
  referencePoNumber,
  termsOfPayment,
  entityName,
  siteName,
  premisesType,
  addressText,
  billToAddressText,
  gstin,
  items,
  total,
  amountInWords,
  termsAndConditions,
}: CommercialInvoiceDocumentProps) {
  const bodyFont = invoiceBodyFontFamily(locale);
  const accent = accentColor || colors.rust;
  const displayEntityName = entityName || siteName;
  const shipToAddress = addressText;
  const billToAddress = billToAddressText ?? addressText;
  const termsLines = (termsAndConditions ?? "").split("\n").filter((l) => l.trim());

  const AddressBox = ({ label, address }: { label: string; address: string | null }) => (
    <View style={[sharedStyles.box, { borderColor: accent }]}>
      <SectionLabel accent={accent}>{label}</SectionLabel>
      <Text style={sharedStyles.boxEntityName}>{displayEntityName}</Text>
      <Text style={sharedStyles.boxLine}>{siteName}</Text>
      {premisesType && <Text style={sharedStyles.boxLine}>{premisesType}</Text>}
      {address && <Text style={sharedStyles.boxLine}>{address}</Text>}
      {gstin && (
        <Text style={sharedStyles.boxLine}>
          {m.clientGstinLabel} {gstin}
        </Text>
      )}
    </View>
  );

  return (
    <Document title={m.invoiceTitle}>
      <Page size="A4" style={[sharedStyles.page, { fontFamily: bodyFont }]}>
        <HeaderBand
          accent={accent}
          businessName={businessName}
          businessTagline={businessTagline}
          mobNoLabel={m.mobNoLabel}
          mobNo={mobNo}
        />
        <View style={sharedStyles.body}>
          <View style={styles.titleBlock}>
            <Text style={[styles.invoiceTitle, { color: accent }]}>{m.invoiceTitle}</Text>
          </View>

          <View style={sharedStyles.boxesRow}>
            <AddressBox label={m.billToLabel} address={billToAddress} />
            <AddressBox label={m.shipToLabel} address={shipToAddress} />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              <Text style={styles.metaBold}>{m.invoiceNoDocLabel} </Text>
              {billNoText}
            </Text>
            <Text style={styles.metaText}>
              <Text style={styles.metaBold}>{m.invoiceDateLabel} </Text>
              {dateText}
            </Text>
            <Text style={styles.metaText}>
              <Text style={styles.metaBold}>{m.billingPeriodLabel} </Text>
              {billingPeriodText}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              <Text style={styles.metaBold}>{m.referencePoDocLabel} </Text>
              {referencePoNumber || m.noReferencePlaceholder}
            </Text>
            <Text style={styles.metaText}>
              <Text style={styles.metaBold}>{m.termsOfPaymentDocLabel} </Text>
              {termsOfPayment}
            </Text>
          </View>

          <View style={sharedStyles.table}>
            <View style={[sharedStyles.headerRow, { backgroundColor: colors.paper2 }]}>
              <Text style={[sharedStyles.cell, styles.colSlNo, sharedStyles.headerCellText]}>
                {m.slNoHeader}
              </Text>
              <Text
                style={[sharedStyles.cell, styles.colDescription, sharedStyles.headerCellText]}
              >
                {m.descriptionOfServicesHeader}
              </Text>
              <Text style={[sharedStyles.cell, styles.colQty, sharedStyles.headerCellText]}>
                {m.qtyHeader}
              </Text>
              <Text style={[sharedStyles.cell, styles.colRate, sharedStyles.headerCellText]}>
                {m.rateHeader}
              </Text>
              <Text style={[sharedStyles.cell, styles.colPer, sharedStyles.headerCellText]}>
                {m.perHeader}
              </Text>
              <Text
                style={[sharedStyles.cellLast, styles.colAmount, sharedStyles.headerCellText]}
              >
                {m.amountHeader}
              </Text>
            </View>

            {items.map((item, i) => (
              <View key={i} style={sharedStyles.bodyRow}>
                <Text style={[sharedStyles.cell, styles.colSlNo]}>{i + 1}</Text>
                <Text style={[sharedStyles.cell, styles.colDescription]}>
                  {item.description}
                </Text>
                <Text style={[sharedStyles.cell, styles.colQty]}>
                  {formatQuantity(item.quantity)}
                </Text>
                <Text style={[sharedStyles.cell, styles.colRate]}>
                  {formatRate(item.rate)}
                </Text>
                <Text style={[sharedStyles.cell, styles.colPer]}>{item.unit}</Text>
                <Text style={[sharedStyles.cellLast, styles.colAmount]}>
                  {formatAmount(item.amount)}
                </Text>
              </View>
            ))}

            <View style={sharedStyles.totalRow}>
              <Text style={[sharedStyles.cell, styles.colSlNo]} />
              <Text style={[sharedStyles.cell, styles.colDescription]} />
              <Text style={[sharedStyles.cell, styles.colQty]} />
              <Text style={[sharedStyles.cell, styles.colRate]} />
              <Text style={[sharedStyles.cell, styles.colPer, sharedStyles.bold]}>
                {m.totalLabel}
              </Text>
              <Text
                style={[
                  sharedStyles.cellLast,
                  styles.colAmount,
                  sharedStyles.bold,
                  { color: accent },
                ]}
              >
                {formatAmount(total)}
              </Text>
            </View>
          </View>

          <Text style={styles.amountInWords}>
            {m.amountInWordsLabelCommercial} {amountInWords}
          </Text>

          {termsLines.length > 0 && (
            <View style={styles.termsBlock}>
              <Text style={styles.termsHeading}>{m.termsAndConditionsHeading}</Text>
              {termsLines.map((line, i) => (
                <Text key={i} style={styles.termsLine}>
                  {line}
                </Text>
              ))}
            </View>
          )}

          <SignatureBlock
            businessName={businessName}
            forLabel={m.forLabel}
            authorizedSignatoryLabel={m.authorizedSignatoryLabel}
          />
        </View>
      </Page>
    </Document>
  );
}
