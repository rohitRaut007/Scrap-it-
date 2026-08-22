import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { colors } from "@scrap-it/design-tokens";
import { INVOICE_DISPLAY_FONT } from "@/lib/invoice-fonts";

export function formatAmount(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatRate(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** Fixed traditional-letterhead maroon for the business name — intentionally
 *  NOT colors.rust and NOT the collector's customizable accentColor; this is
 *  a print-convention color specific to this letterhead style, sampled from
 *  the reference invoice PDFs. */
const LETTERHEAD_NAME_COLOR = "#5C1220";

/** Shared themed style fragments for both bill templates — a plain header
 *  block (business name in a fixed letterhead maroon, everything else black
 *  ink), plain black-bordered address boxes with a bold text label, a tinted
 *  table header row, and a plain black total. Both templates render these
 *  identically so the two documents stay visually consistent; only their
 *  content/columns differ. */
export const sharedStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: colors.ink },
  body: { padding: 28 },
  headerBand: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  headerBusinessName: {
    fontFamily: INVOICE_DISPLAY_FONT,
    fontSize: 26,
    fontWeight: "bold",
    color: LETTERHEAD_NAME_COLOR,
  },
  headerTagline: {
    marginTop: 4,
    fontSize: 9.5,
    color: colors.inkSoft,
  },
  headerMeta: {
    marginTop: 6,
    fontSize: 9,
    color: colors.inkSoft,
  },
  boxesRow: { flexDirection: "row", marginTop: 18, gap: 12 },
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink,
    padding: 10,
  },
  sectionLabel: { fontSize: 9.5, fontWeight: "bold", marginBottom: 4 },
  boxEntityName: { fontSize: 11, fontWeight: "bold", marginTop: 2 },
  boxLine: { fontSize: 9.5, marginTop: 2, color: colors.inkSoft },
  table: { marginTop: 16, borderWidth: 1, borderColor: colors.ink },
  row: { flexDirection: "row" },
  headerRow: { flexDirection: "row" },
  bodyRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: colors.rule,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: colors.ink,
  },
  cell: {
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: colors.rule,
  },
  cellLast: { padding: 6 },
  headerCellText: { fontSize: 8.5, fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  metaBox: { marginTop: 14, borderWidth: 1, borderColor: colors.ink },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  metaRowDivider: { borderTopWidth: 0.5, borderTopColor: colors.ink },
  metaLabel: { fontSize: 9.5 },
  metaValue: { fontSize: 9.5, fontWeight: "bold" },
  signatureBlock: { marginTop: 36 },
  forLine: { fontSize: 10, fontWeight: "bold" },
  signatureGap: { height: 42 },
  authorized: { fontSize: 10 },
});

/** Plain bold label — e.g. "BILL TO" / "SHIP TO". */
export function SectionLabel({ children }: { children: string }) {
  return <Text style={sharedStyles.sectionLabel}>{children}</Text>;
}

export function HeaderBand({
  businessName,
  businessTagline,
  mobNoLabel,
  mobNo,
  businessAddressText,
}: {
  businessName: string;
  businessTagline: string | null;
  mobNoLabel: string;
  mobNo: string | null;
  businessAddressText?: string | null;
}) {
  const mobLine = mobNo
    ? businessAddressText
      ? `${mobNoLabel} ${mobNo} | ${businessAddressText}`
      : `${mobNoLabel} ${mobNo}`
    : businessAddressText;

  return (
    <View style={sharedStyles.headerBand}>
      <Text style={sharedStyles.headerBusinessName}>{businessName}</Text>
      {businessTagline && <Text style={sharedStyles.headerTagline}>{businessTagline}</Text>}
      {mobLine && <Text style={sharedStyles.headerMeta}>{mobLine}</Text>}
    </View>
  );
}

/** BILL TO / SHIP TO address box — plain black border, identical for both
 *  invoice templates. */
export function AddressBox({
  label,
  displayEntityName,
  siteName,
  premisesType,
  address,
  gstin,
  clientGstinLabel,
}: {
  label: string;
  displayEntityName: string;
  siteName: string;
  premisesType: string | null;
  address: string | null;
  gstin: string | null;
  clientGstinLabel: string;
}) {
  return (
    <View style={sharedStyles.box}>
      <SectionLabel>{label}</SectionLabel>
      <Text style={sharedStyles.boxEntityName}>{displayEntityName}</Text>
      <Text style={sharedStyles.boxLine}>{siteName}</Text>
      {premisesType && <Text style={sharedStyles.boxLine}>{premisesType}</Text>}
      {address && <Text style={sharedStyles.boxLine}>{address}</Text>}
      {gstin && (
        <Text style={sharedStyles.boxLine}>
          {clientGstinLabel} {gstin}
        </Text>
      )}
    </View>
  );
}

/** Bordered label/value rows — used by the commercial invoice for its
 *  Invoice No. / Invoice Date / Billing Period / Reference-PO / Terms of
 *  Payment block. */
export function MetaInfoTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View style={sharedStyles.metaBox}>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[sharedStyles.metaRow, i > 0 ? sharedStyles.metaRowDivider : {}]}
        >
          <Text style={sharedStyles.metaLabel}>{row.label}</Text>
          <Text style={sharedStyles.metaValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** Residential signature: "For {businessName}", blank gap, "Authorized
 *  Signatory" — no mobile number line. */
export function SignatureBlock({
  businessName,
  forLabel,
  authorizedSignatoryLabel,
}: {
  businessName: string;
  forLabel: string;
  authorizedSignatoryLabel: string;
}) {
  return (
    <View style={sharedStyles.signatureBlock}>
      <Text style={sharedStyles.forLine}>
        {forLabel} {businessName}
      </Text>
      <View style={sharedStyles.signatureGap} />
      <Text style={sharedStyles.authorized}>{authorizedSignatoryLabel}</Text>
    </View>
  );
}

/** Commercial signature: "{businessName}" (no "For" prefix) + mobile number
 *  line, blank gap, "Authorized Signatory". */
export function CommercialSignatureBlock({
  businessName,
  mobNoLabel,
  mobNo,
  authorizedSignatoryLabel,
}: {
  businessName: string;
  mobNoLabel: string;
  mobNo: string | null;
  authorizedSignatoryLabel: string;
}) {
  return (
    <View style={sharedStyles.signatureBlock}>
      <Text style={sharedStyles.forLine}>{businessName}</Text>
      {mobNo && (
        <Text style={sharedStyles.authorized}>
          {mobNoLabel} {mobNo}
        </Text>
      )}
      <View style={sharedStyles.signatureGap} />
      <Text style={sharedStyles.authorized}>{authorizedSignatoryLabel}</Text>
    </View>
  );
}
