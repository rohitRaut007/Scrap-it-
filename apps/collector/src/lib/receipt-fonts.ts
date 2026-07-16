import { Font } from "@react-pdf/renderer";

let registered = false;

/** Register the Unicode fonts receipts render with — Latin for en, Devanagari
 *  (which also covers Basic Latin) for hi/mr. Registration is a one-time,
 *  process-wide side effect, so guard against re-registering on every render. */
export function ensureReceiptFontsRegistered() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "NotoSans",
    fonts: [
      { src: "/fonts/NotoSans-Regular.ttf", fontWeight: "normal" },
      { src: "/fonts/NotoSans-Bold.ttf", fontWeight: "bold" },
    ],
  });

  Font.register({
    family: "NotoSansDevanagari",
    fonts: [
      { src: "/fonts/NotoSansDevanagari-Regular.ttf", fontWeight: "normal" },
      { src: "/fonts/NotoSansDevanagari-Bold.ttf", fontWeight: "bold" },
    ],
  });
}

/** Font family to use for a receipt rendered in the given portal locale. */
export function receiptFontFamily(locale: string): string {
  return locale === "hi" || locale === "mr" ? "NotoSansDevanagari" : "NotoSans";
}
