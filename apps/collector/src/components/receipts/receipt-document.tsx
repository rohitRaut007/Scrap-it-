import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { receiptFontFamily } from "@/lib/receipt-fonts";

export interface ReceiptLineItem {
  name: string;
  weightKg: number | null;
  rateInrPerKg: number | null;
  amountInr: number | null;
}

export interface ReceiptBusinessDetails {
  shopName: string | null;
  shopAddressText: string | null;
  gstNumber: string | null;
}

/** Already-resolved (translated) strings — kept i18n-library-agnostic. */
export interface ReceiptMessages {
  docTitle: string;
  receiptNoLabel: string;
  dateLabel: string;
  customerLabel: string;
  itemsHeader: string;
  weightLabel: string;
  rateLabel: string;
  amountLabel: string;
  totalLabel: string;
  poweredBy: string;
}

export interface ReceiptDocumentProps {
  locale: string;
  messages: ReceiptMessages;
  dateText: string;
  customerName: string | null;
  customerPhone: string | null;
  items: ReceiptLineItem[];
  totalInr: number | null;
  business: ReceiptBusinessDetails | null;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1a1a1a" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  docTitle: { fontSize: 18, fontWeight: "bold" },
  receiptNo: { fontSize: 10, marginTop: 4, color: "#555" },
  dateText: { fontSize: 10, color: "#555" },
  businessBlock: { marginBottom: 16 },
  businessName: { fontSize: 12, fontWeight: "bold" },
  businessLine: { fontSize: 9, color: "#555", marginTop: 2 },
  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 9, color: "#777", marginBottom: 2 },
  sectionValue: { fontSize: 11 },
  table: { marginTop: 8, borderTop: "1pt solid #ccc" },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #ccc",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #eee",
    paddingVertical: 6,
  },
  colName: { flex: 2 },
  colNum: { flex: 1, textAlign: "right" },
  headerText: { fontSize: 9, color: "#777" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
    borderTop: "1pt solid #1a1a1a",
  },
  totalLabel: { fontSize: 12, fontWeight: "bold" },
  totalValue: { fontSize: 14, fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});

function formatInr(value: number | null): string {
  if (value == null) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function ReceiptDocument({
  locale,
  messages,
  dateText,
  customerName,
  customerPhone,
  items,
  totalInr,
  business,
}: ReceiptDocumentProps) {
  const fontFamily = receiptFontFamily(locale);

  return (
    <Document title={messages.docTitle}>
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.docTitle}>{messages.docTitle}</Text>
            <Text style={styles.receiptNo}>{messages.receiptNoLabel}</Text>
          </View>
          <View>
            <Text style={styles.dateText}>
              {messages.dateLabel}: {dateText}
            </Text>
          </View>
        </View>

        {business && (business.shopName || business.shopAddressText || business.gstNumber) && (
          <View style={styles.businessBlock}>
            {business.shopName && (
              <Text style={styles.businessName}>{business.shopName}</Text>
            )}
            {business.shopAddressText && (
              <Text style={styles.businessLine}>{business.shopAddressText}</Text>
            )}
            {business.gstNumber && (
              <Text style={styles.businessLine}>GSTIN: {business.gstNumber}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{messages.customerLabel}</Text>
          <Text style={styles.sectionValue}>{customerName ?? "—"}</Text>
          {customerPhone && (
            <Text style={styles.businessLine}>{customerPhone}</Text>
          )}
        </View>

        <View>
          <Text style={styles.sectionLabel}>{messages.itemsHeader}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colName, styles.headerText]}>
                {messages.itemsHeader}
              </Text>
              <Text style={[styles.colNum, styles.headerText]}>
                {messages.weightLabel}
              </Text>
              <Text style={[styles.colNum, styles.headerText]}>
                {messages.rateLabel}
              </Text>
              <Text style={[styles.colNum, styles.headerText]}>
                {messages.amountLabel}
              </Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colName}>{item.name}</Text>
                <Text style={styles.colNum}>
                  {item.weightKg != null ? item.weightKg.toFixed(2) : "—"}
                </Text>
                <Text style={styles.colNum}>
                  {item.rateInrPerKg != null ? item.rateInrPerKg : "—"}
                </Text>
                <Text style={styles.colNum}>{formatInr(item.amountInr)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{messages.totalLabel}</Text>
          <Text style={styles.totalValue}>{formatInr(totalInr)}</Text>
        </View>

        <Text style={styles.footer}>{messages.poweredBy}</Text>
      </Page>
    </Document>
  );
}
