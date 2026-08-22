import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "@scrap-it/design-tokens";
import { invoiceBodyFontFamily } from "@/lib/invoice-fonts";
import {
  sharedStyles,
  formatAmount,
  formatQuantity,
  formatRate,
  HeaderBand,
  AddressBox,
  SignatureBlock,
} from "./invoice-document-shared";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

/** Already-resolved (translated) strings — kept i18n-library-agnostic. */
export interface ResidentialBillMessages {
  billOfTitle: string; // e.g. "Bill of June"
  billNoText: string; // e.g. "BILL NO : RES-007", or a draft placeholder
  mobNoLabel: string;
  dateLabel: string;
  billToLabel: string;
  shipToLabel: string;
  clientGstinLabel: string;
  srNoHeader: string;
  descriptionHeader: string;
  qtyHeader: string;
  rateHeader: string;
  amountHeader: string;
  totalLabel: string;
  amountInWordsPrefix: string;
  amountInWordsSuffix: string;
  checkPaymentNameLabel: string;
  forLabel: string;
  authorizedSignatoryLabel: string;
}

export interface ResidentialBillDocumentProps {
  locale: string;
  messages: ResidentialBillMessages;
  accentColor?: string | null;
  businessName: string;
  businessTagline: string | null;
  businessAddressText?: string | null;
  mobNo: string | null;
  dateText: string;
  entityName: string | null;
  siteName: string;
  premisesType: string | null;
  addressText: string | null;
  billToAddressText: string | null;
  gstin: string | null;
  items: InvoiceLineItem[];
  total: number;
  /** Bare words, no "Rs,"/"Only" wrapper — the template supplies those. */
  amountInWords: string;
  payableTo: string | null;
}

const styles = StyleSheet.create({
  titleBlock: { marginTop: 18, alignItems: "center", position: "relative" },
  billOfTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textDecoration: "underline",
  },
  dateTopRight: { position: "absolute", top: -8, right: 0, fontSize: 9.5, fontWeight: "bold" },
  billNoTopRight: { position: "absolute", top: 22, right: 0, fontSize: 10, fontWeight: "bold" },
  colSrNo: { width: "8%" },
  colDescription: { width: "42%" },
  colQty: { width: "17%" },
  colRate: { width: "15%" },
  colAmount: { width: "18%" },
  amountInWords: { marginTop: 16, fontSize: 10.5 },
  payableTo: { marginTop: 10, fontSize: 10, textDecoration: "underline" },
});

export function ResidentialBillDocument({
  locale,
  messages: m,
  businessName,
  businessTagline,
  businessAddressText,
  mobNo,
  dateText,
  entityName,
  siteName,
  premisesType,
  addressText,
  billToAddressText,
  gstin,
  items,
  total,
  amountInWords,
  payableTo,
}: ResidentialBillDocumentProps) {
  const bodyFont = invoiceBodyFontFamily(locale);
  const displayEntityName = entityName || siteName;
  const shipToAddress = addressText;
  const billToAddress = billToAddressText ?? addressText;

  return (
    <Document title={m.billOfTitle}>
      <Page size="A4" style={[sharedStyles.page, { fontFamily: bodyFont }]}>
        <HeaderBand
          businessName={businessName}
          businessTagline={businessTagline}
          businessAddressText={businessAddressText}
          mobNoLabel={m.mobNoLabel}
          mobNo={mobNo}
        />
        <View style={sharedStyles.body}>
          <View style={styles.titleBlock}>
            <Text style={styles.dateTopRight}>
              {m.dateLabel} {dateText}
            </Text>
            <Text style={styles.billOfTitle}>{m.billOfTitle}</Text>
            <Text style={styles.billNoTopRight}>{m.billNoText}</Text>
          </View>

          <View style={sharedStyles.boxesRow}>
            <AddressBox
              label={m.billToLabel}
              displayEntityName={displayEntityName}
              siteName={siteName}
              premisesType={premisesType}
              address={billToAddress}
              gstin={gstin}
              clientGstinLabel={m.clientGstinLabel}
            />
            <AddressBox
              label={m.shipToLabel}
              displayEntityName={displayEntityName}
              siteName={siteName}
              premisesType={premisesType}
              address={shipToAddress}
              gstin={gstin}
              clientGstinLabel={m.clientGstinLabel}
            />
          </View>

          <View style={sharedStyles.table}>
            <View style={[sharedStyles.headerRow, { backgroundColor: colors.paper2 }]}>
              <Text style={[sharedStyles.cell, styles.colSrNo, sharedStyles.headerCellText]}>
                {m.srNoHeader}
              </Text>
              <Text
                style={[sharedStyles.cell, styles.colDescription, sharedStyles.headerCellText]}
              >
                {m.descriptionHeader}
              </Text>
              <Text style={[sharedStyles.cell, styles.colQty, sharedStyles.headerCellText]}>
                {m.qtyHeader}
              </Text>
              <Text style={[sharedStyles.cell, styles.colRate, sharedStyles.headerCellText]}>
                {m.rateHeader}
              </Text>
              <Text
                style={[sharedStyles.cellLast, styles.colAmount, sharedStyles.headerCellText]}
              >
                {m.amountHeader}
              </Text>
            </View>

            {items.map((item, i) => (
              <View key={i} style={sharedStyles.bodyRow}>
                <Text style={[sharedStyles.cell, styles.colSrNo]}>{i + 1}</Text>
                <Text style={[sharedStyles.cell, styles.colDescription]}>
                  {item.description}
                </Text>
                <Text style={[sharedStyles.cell, styles.colQty]}>
                  {formatQuantity(item.quantity)} {item.unit}
                </Text>
                <Text style={[sharedStyles.cell, styles.colRate]}>
                  {formatRate(item.rate)}
                </Text>
                <Text style={[sharedStyles.cellLast, styles.colAmount]}>
                  {formatAmount(item.amount)}
                </Text>
              </View>
            ))}

            <View style={sharedStyles.totalRow}>
              <Text style={[sharedStyles.cell, styles.colSrNo]} />
              <Text style={[sharedStyles.cell, styles.colDescription]} />
              <Text style={[sharedStyles.cell, styles.colQty]} />
              <Text style={[sharedStyles.cell, styles.colRate, sharedStyles.bold]}>
                {m.totalLabel}
              </Text>
              <Text style={[sharedStyles.cellLast, styles.colAmount, sharedStyles.bold]}>
                {formatAmount(total)}
              </Text>
            </View>
          </View>

          <Text style={styles.amountInWords}>
            {m.amountInWordsPrefix} {amountInWords} {m.amountInWordsSuffix}
          </Text>

          {payableTo && (
            <Text style={styles.payableTo}>
              {m.checkPaymentNameLabel}: {payableTo}
            </Text>
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
