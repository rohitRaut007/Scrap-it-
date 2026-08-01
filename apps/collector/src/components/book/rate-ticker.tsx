import { cn } from "@/lib/utils";

interface RateTickerProps {
  entries: string[];
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
 * Pure/presentational on purpose — the caller resolves `entries` (real
 * rates or a translated fallback) so this same component works from a
 * server context (`/book/[slug]`, public rate card) and a client context
 * (`PortalShell`, the signed-in collector's own rate card via `useRateCard`).
 */
export function RateTicker({ entries, sticky = true }: RateTickerProps) {
  return (
    <div
      className={cn(
        "z-20 overflow-hidden border-b-2 border-rust bg-ink py-3",
        sticky && "sticky top-0",
      )}
    >
      <div className="animate-ticker-scroll motion-reduce:animate-none inline-flex w-max gap-12 pl-[100%] font-mono text-sm font-medium whitespace-nowrap text-paper">
        {entries.map((entry, i) => (
          <span key={i} className="inline-flex items-center gap-12">
            <span>{entry}</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-rust" />
          </span>
        ))}
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
