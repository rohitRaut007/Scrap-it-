"use client";

import { useTranslations } from "next-intl";
import {
  RateTicker,
  formatTickerLabel,
  oldestRateUpdatedAt,
  ratesToTickerEntries,
} from "@/components/book/rate-ticker";
import { useRateCard } from "@/hooks/use-portal";

/**
 * The same `/book/[slug]` rate-ticker strip, mounted at the top of every
 * authenticated portal page via `PortalShell` — but showing the signed-in
 * collector's own rate card (`useRateCard`, already used by the log-pickup
 * dialog and rate-card form) instead of a public collector's.
 */
export function PortalRateTicker() {
  const t = useTranslations("book");
  const { data: rateCard } = useRateCard();
  const items = rateCard ?? [];

  // Show the brand-tagline fallback while loading rather than nothing —
  // the ticker is a fixture of the shell, it shouldn't flash empty on
  // every page navigation while SWR's cache is still warming up.
  const entries = ratesToTickerEntries(items, t("tickerFallback"));
  const label = formatTickerLabel(t, oldestRateUpdatedAt(items));

  return <RateTicker entries={entries} label={label} sticky={false} />;
}
