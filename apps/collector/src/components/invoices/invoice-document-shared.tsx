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

/** Shared themed style fragments for both bill templates — a solid accent-color
 *  header band (white text), accent-bordered address boxes with a small square
 *  bullet label, a tinted table header row, and an accent-colored total. Both
 *  templates render these identically so the two documents stay visually
 *  consistent; only their content/columns differ. */
export const sharedStyles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: colors.ink },
  body: { padding: 28 },
  headerBand: {
    backgroundColor: colors.rust,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  headerBusinessName: {
    fontFamily: INVOICE_DISPLAY_FONT,
    fontSize: 26,
    color: colors.paper,
  },
  headerTagline: {
    marginTop: 4,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.paper,
    opacity: 0.9,
  },
  headerMeta: {
    marginTop: 6,
    fontSize: 9,
    color: colors.paper,
    opacity: 0.9,
  },
  boxesRow: { flexDirection: "row", marginTop: 18, gap: 12 },
  box: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
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
  signatureBlock: { marginTop: 36 },
  forLine: { fontSize: 10, fontWeight: "bold" },
  signatureGap: { height: 42 },
  authorized: { fontSize: 10 },
});

export function accentBorder(accent: string) {
  return { borderColor: accent };
}

/** "■ BILL TO" style bullet + label, in the accent color. */
export function SectionLabel({ accent, children }: { accent: string; children: string }) {
  return (
    <Text style={[sharedStyles.sectionLabel, { color: accent }]}>■ {children}</Text>
  );
}

export function HeaderBand({
  accent,
  businessName,
  businessTagline,
  mobNoLabel,
  mobNo,
}: {
  accent: string;
  businessName: string;
  businessTagline: string | null;
  mobNoLabel: string;
  mobNo: string | null;
}) {
  return (
    <View style={[sharedStyles.headerBand, { backgroundColor: accent }]}>
      <Text style={sharedStyles.headerBusinessName}>{businessName}</Text>
      {businessTagline && <Text style={sharedStyles.headerTagline}>{businessTagline}</Text>}
      {mobNo && (
        <Text style={sharedStyles.headerMeta}>
          {mobNoLabel} {mobNo}
        </Text>
      )}
    </View>
  );
}

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
