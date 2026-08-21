"use client";

import { SWRConfig } from "swr";

/**
 * Global SWR defaults for a mobile-first PWA on patchy connectivity.
 * Per-hook `refreshInterval` overrides in use-portal.ts take precedence —
 * these only affect keys that don't already specify their own options.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Collapses near-simultaneous mounts of the same key (e.g. the rate
        // ticker + a dialog both mounting useRateCard at once) without
        // touching the 30s polls, which are far outside this window.
        dedupingInterval: 5000,
        // Keep revalidate-on-focus on — it's the freshness signal that
        // matters most for a hand-off/shared-device app — but throttle it
        // so repeated app-switching (WhatsApp and back, on mobile) doesn't
        // refetch everything on every single return.
        revalidateOnFocus: true,
        focusThrottleInterval: 60_000,
        // Patchy mobile data dropping and reconnecting is the norm here —
        // keep this on, don't weaken it.
        revalidateOnReconnect: true,
        refreshWhenHidden: false,
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  );
}
