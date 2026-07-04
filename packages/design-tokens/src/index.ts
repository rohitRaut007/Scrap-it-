/**
 * Scrap-it Paper — the single source of truth for the design system.
 *
 * Every surface (mobile, admin, collector) consumes these tokens.
 * The values are frozen; do not "improve" them here. Changing a value
 * here re-themes the entire product.
 */

/** The nine palette tokens. Newsprint paper + ink + copper rust. */
export const colors = {
  /** Primary background — newsprint. */
  paper: "#F3EEDF",
  /** Section / raised surface — aged paper. */
  paper2: "#EAE4D2",
  /** Primary text, dark surfaces. */
  ink: "#1A1918",
  /** Secondary / muted text. */
  inkSoft: "#4A4744",
  /** Primary accent — copper rust. */
  rust: "#B84E1C",
  /** Rust hover / pressed. */
  rustDark: "#8F3D15",
  /** Success, positive delta, money. */
  cash: "#1D5E3E",
  /** Live rate / alert / gold. */
  signal: "#EDBB33",
  /** Dividers, hairlines. */
  rule: "#C9C1AB",
} as const;

/** Semantic aliases over the base palette. */
export const semanticColors = {
  ok: colors.cash,
  warn: colors.rust,
  deltaUp: "#6AC37B",
  deltaDown: "#E07A5A",
} as const;

/** Semantic role → font family name. */
export const fontFamilies = {
  display: "Rozha One",
  body: "Hind",
  mono: "IBM Plex Mono",
} as const;

/** Font metadata (weights available per family). */
export const fonts = {
  display: { family: "Rozha One", weights: [400], devanagari: true },
  body: { family: "Hind", weights: [300, 400, 500, 600, 700], devanagari: true },
  mono: {
    family: "IBM Plex Mono",
    weights: [400, 500, 600, 700],
    devanagari: false,
  },
} as const;

/** Google Fonts stylesheet URL for surfaces that load fonts via <link>. */
export const googleFontsHref =
  "https://fonts.googleapis.com/css2?family=Rozha+One&family=Hind:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap";

/**
 * Type scale. Sizes in px; `mobile` is the small-viewport override.
 * `family` keys into `fontFamilies`.
 */
export const typeScale = {
  heroH1: {
    size: "clamp(48px, 8vw, 96px)",
    family: "display",
    lineHeight: 0.95,
    tracking: "-0.02em",
  },
  h2Section: { size: 52, mobile: 36, family: "display", lineHeight: 1.02, tracking: "-0.01em" },
  h3Feature: { size: 32, mobile: 24, family: "display", lineHeight: 1.1 },
  counter: { size: 72, mobile: 48, family: "display", lineHeight: 0.9, color: colors.rust },
  price: { size: 36, family: "display", lineHeight: 1.0 },
  heroSub: { size: 22, mobile: 18, family: "body", weight: 400, lineHeight: 1.55 },
  body: { size: 17, mobile: 16, family: "body", weight: 400, lineHeight: 1.55 },
  bodySection: { size: 19, family: "body", weight: 400, lineHeight: 1.55 },
  featureList: { size: 16, family: "body", weight: 400, lineHeight: 1.5 },
  eyebrow: {
    size: 12,
    family: "mono",
    tracking: "2px",
    uppercase: true,
    color: colors.rust,
  },
  metaLabel: {
    size: 11,
    family: "mono",
    tracking: "1.5px",
    uppercase: true,
    color: colors.inkSoft,
  },
  tickerData: { size: 14, family: "mono", weight: 500 },
} as const;

/** Spacing & radius constants (px unless noted). */
export const layout = {
  containerMaxWidth: 1080,
  sectionPaddingY: { desktop: 100, mobile: 60 },
  featureBlockPaddingY: { desktop: 44, mobile: 32 },
  cardPadding: "16px 18px",
  /** 0 for structural elements; 6px only for small chips/tags. */
  radius: { structural: 0, chip: 6 },
} as const;
