import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Register the fonts invoices render with: Rozha One for the letterhead
 * (self-hosted; already the design system's display serif, previously
 * CDN-only) and the same NotoSans/NotoSansDevanagari pair the receipt PDF
 * already uses for body text — reusing it here instead of adding a second,
 * much heavier serif family for body copy. Registration is a one-time,
 * process-wide side effect, so guard against re-registering on every render.
 */
export function ensureInvoiceFontsRegistered() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "RozhaOne",
    fonts: [{ src: "/fonts/RozhaOne-Regular.ttf", fontWeight: "normal" }],
  });

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

/** Body font family to use for an invoice rendered in the given portal locale. */
export function invoiceBodyFontFamily(locale: string): string {
  return locale === "hi" || locale === "mr" ? "NotoSansDevanagari" : "NotoSans";
}

/** Letterhead/display font — Rozha One covers Latin + Devanagari, same family for all locales. */
export const INVOICE_DISPLAY_FONT = "RozhaOne";
