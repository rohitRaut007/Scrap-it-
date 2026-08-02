import { cn } from "@/lib/utils";

interface RateTickerProps {
  entries: string[];
  /** e.g. "Rates · Updated 2 days ago" — omitted (no chip) when null. */
  label?: string | null;
  /**
   * `/book/[slug]` has no other sticky header, so the ticker itself sticks
   * to the viewport top. The portal shell already has its own sticky
   * mobile header / desktop sidebar (both anchored at `top-0`) — stacking
   * two independent `top-0` stickies there would overlap them, so that
   * usage renders the ticker as a plain top-of-page banner instead: it
   * scrolls away first, then the shell's own header takes over sticking.
   */
  sticky?: boolean;
}

/**
 * Full-bleed stock-ticker style strip — enters from the right, exits left,
 * restarts (`animate-ticker-scroll` in globals.css). Deliberately shows no
 * up/down deltas: we don't track historical rates, so a trend arrow would
 * be fabricated, not real data.
 *
 * The static `label` chip (pinned left, non-scrolling) exists so this never
 * reads as a live market feed: a collector's rate card is a number they set
 * by hand and rarely touch, so the honest framing is "here's the posted
 * rate sheet, last touched N days ago" — not an implied real-time price feed.
 *
 * Pure/presentational on purpose — the caller resolves `entries`/`label`
 * (real rates or a translated fallback) so this same component works from a
 * server context (`/book/[slug]`, public rate card) and a client context
 * (`PortalShell`, the signed-in collector's own rate card via `useRateCard`).
 */
export function RateTicker({ entries, label, sticky = true }: RateTickerProps) {
  return (
    <div
      className={cn(
        "z-20 flex items-stretch overflow-hidden border-b-2 border-rust bg-ink",
        sticky && "sticky top-0",
      )}
    >
      {label && (
        <span className="flex shrink-0 items-center gap-2 border-r border-ink bg-rust px-3.5 py-3 font-mono text-[11px] font-semibold tracking-widest text-primary-foreground uppercase">
          {label}
        </span>
      )}
      <div className="overflow-hidden py-3">
        <div className="animate-ticker-scroll motion-reduce:animate-none inline-flex w-max gap-12 pl-[100%] font-mono text-sm font-medium whitespace-nowrap text-paper">
          {entries.map((entry, i) => (
            <span key={i} className="inline-flex items-center gap-12">
              <span>{entry}</span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-rust" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Shared rate→ticker-entry formatting so both call sites stay in sync. */
export function ratesToTickerEntries(
  items: { name: string; rateInrPerKg: number | null }[],
  fallback: string,
): string[] {
  const priced = items.filter(
    (item): item is { name: string; rateInrPerKg: number } =>
      item.rateInrPerKg != null,
  );
  return priced.length > 0
    ? priced.map((item) => `${item.name} · ₹${item.rateInrPerKg}/kg`)
    : fallback.split(" · ");
}

/**
 * The OLDEST `rateUpdatedAt` among currently-priced items — deliberately
 * the least-fresh timestamp, not the most recent one, so the label always
 * reflects the worst case ("this is at least as stale as X") rather than
 * cherry-picking whichever category happens to have been touched recently.
 */
export function oldestRateUpdatedAt(
  items: { rateInrPerKg: number | null; rateUpdatedAt: string | null }[],
): string | null {
  const timestamps = items
    .filter((item) => item.rateInrPerKg != null && item.rateUpdatedAt)
    .map((item) => new Date(item.rateUpdatedAt!).getTime());
  if (timestamps.length === 0) return null;
  return new Date(Math.min(...timestamps)).toISOString();
}

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Builds the ticker's static "Rates · Updated N days ago" label, fully localized. */
export function formatTickerLabel(
  t: Translate,
  oldestUpdatedAtIso: string | null,
): string | null {
  if (!oldestUpdatedAtIso) return null;
  const diffMs = Date.now() - new Date(oldestUpdatedAtIso).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  const when =
    days < 1
      ? t("tickerUpdatedToday")
      : days < 7
        ? t("tickerUpdatedDaysAgo", { count: days })
        : days < 35
          ? t("tickerUpdatedWeeksAgo", { count: Math.floor(days / 7) })
          : t("tickerUpdatedMonthsAgo", { count: Math.floor(days / 30) });

  return `${t("tickerLabel")} · ${when}`;
}
